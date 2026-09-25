from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Institution
from .permissions import IsAdminUser
from .serializers import (
    AdminUserSerializer,
    ChangePasswordSerializer,
    InstitutionSerializer,
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileSerializer,
    RegisterSerializer,
    SessionSerializer,
    UserSerializer,
)
from .tokens import active_tokens, refresh_jti, revoke_tokens

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/: Create a new account."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/: Get JWT access + refresh tokens."""
    permission_classes = [AllowAny]


class RefreshView(TokenRefreshView):
    """POST /api/auth/refresh/: Refresh an expired access token."""
    permission_classes = [AllowAny]


class LogoutView(generics.GenericAPIView):
    """POST /api/auth/logout/: Blacklist the refresh token."""
    serializer_class = LogoutSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/auth/me/: Get current user profile.
    PUT  /api/auth/me/: Update profile.
    """
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class InstitutionListView(generics.ListAPIView):
    """GET /api/auth/institutions/: Institutions a user can belong to (public: the sign-up form needs it)."""
    queryset = Institution.objects.all()
    serializer_class = InstitutionSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class ChangePasswordView(generics.GenericAPIView):
    """POST /api/auth/change-password/: Change the current user's password; other sessions are signed out."""
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        revoked = revoke_tokens(request.user, except_jti=refresh_jti(serializer.validated_data.get('refresh')))
        return Response({'detail': 'Password updated.', 'other_sessions_signed_out': revoked})


class PasswordResetRequestView(generics.GenericAPIView):
    """POST /api/auth/password-reset/: Email a reset link. Always answers 200 so accounts can't be enumerated."""
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?uid={uid}&token={token}"
            minutes = settings.PASSWORD_RESET_TIMEOUT // 60
            send_mail(
                'Reset your SkillSense password',
                f"Hello {user.first_name or user.email},\n\n"
                f"Use the link below to choose a new password. It expires in {minutes} minutes.\n\n{link}\n\n"
                "If you didn't request this, you can ignore this email.",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
        return Response({'detail': 'If an account exists for that email, a reset link has been sent.'})


class PasswordResetConfirmView(generics.GenericAPIView):
    """POST /api/auth/password-reset/confirm/: Set a new password using the emailed uid + token."""
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        invalid = ValidationError({'detail': 'This reset link is invalid or has expired.'})
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(data['uid'])), is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise invalid
        if not default_token_generator.check_token(user, data['token']):
            raise invalid
        try:
            validate_password(data['new_password'], user)
        except DjangoValidationError as e:
            raise ValidationError({'new_password': list(e.messages)})
        user.set_password(data['new_password'])
        user.save(update_fields=['password'])
        revoke_tokens(user)
        return Response({'detail': 'Password has been reset. You can now sign in.'})


class SessionListView(APIView):
    """GET /api/auth/sessions/: Active sign-ins (refresh tokens) of the current user.
    Send this device's refresh token in the X-Refresh-Token header to have it flagged as current."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=SessionSerializer(many=True))
    def get(self, request):
        current = refresh_jti(request.headers.get('X-Refresh-Token'))
        rows = [
            {'id': t.id, 'created_at': t.created_at, 'expires_at': t.expires_at, 'current': t.jti == current}
            for t in active_tokens(request.user)
        ]
        return Response(SessionSerializer(rows, many=True).data)


class SessionRevokeView(APIView):
    """DELETE /api/auth/sessions/:id/: Sign out one of the current user's sessions."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={204: None})
    def delete(self, request, pk):
        token = active_tokens(request.user).filter(pk=pk).first()
        if not token:
            raise NotFound('Session not found.')
        BlacklistedToken.objects.get_or_create(token=token)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserListView(generics.ListCreateAPIView):
    """GET/POST /api/auth/users/: List or create users (administrators only)."""
    queryset = User.objects.select_related('institution').all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['role', 'is_active', 'institution']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'last_login', 'email']


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/users/:id/: Change a user's role, institution or active status (administrators only)."""
    queryset = User.objects.select_related('institution').all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

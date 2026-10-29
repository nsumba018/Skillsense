from typing import Optional

from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Institution, Invitation

User = get_user_model()


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ['id', 'name', 'type', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    institution = InstitutionSerializer(read_only=True)
    institution_id = serializers.PrimaryKeyRelatedField(
        queryset=Institution.objects.all(),
        source='institution',
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'institution', 'institution_id',
            'is_active', 'date_joined',
        ]
        read_only_fields = ['id', 'is_active', 'date_joined']


class ProfileSerializer(UserSerializer):
    """Self-service profile update: users cannot change their own role."""

    class Meta(UserSerializer.Meta):
        read_only_fields = ['id', 'role', 'is_active', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    institution_id = serializers.PrimaryKeyRelatedField(
        queryset=Institution.objects.all(),
        source='institution',
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'password', 'password_confirm', 'role', 'institution_id',
        ]

    def validate_role(self, value):
        if value == User.UserRole.ADMIN:
            raise serializers.ValidationError("Admin accounts cannot be self-registered.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        # Run Django's full password validation (common, numeric, similarity, length)
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    refresh = serializers.CharField(
        write_only=True, required=False,
        help_text="This device's refresh token: it stays signed in while all other sessions are revoked.",
    )

    def validate_new_password(self, value):
        validate_password(value, self.context['request'].user)
        return value

    def validate(self, attrs):
        if not self.context['request'].user.check_password(attrs['old_password']):
            raise serializers.ValidationError({'old_password': 'Current password is incorrect.'})
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)


class SessionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    expires_at = serializers.DateTimeField()
    current = serializers.BooleanField()


class AdminUserSerializer(serializers.ModelSerializer):
    """User management by administrators — invite-only (no password on create)."""
    institution = InstitutionSerializer(read_only=True)
    institution_id = serializers.PrimaryKeyRelatedField(
        queryset=Institution.objects.all(), source='institution',
        write_only=True, required=False, allow_null=True,
    )
    invitation_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'role',
            'institution', 'institution_id', 'is_active', 'date_joined', 'last_login',
            'invitation_status',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'invitation_status']
        extra_kwargs = {'username': {'required': False}}

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_invitation_status(self, obj) -> Optional[str]:
        inv = getattr(obj, 'invitation', None)
        if inv is None:
            try:
                inv = obj.invitation
            except Invitation.DoesNotExist:
                return None
        if inv.is_expired:
            return 'expired'
        return inv.status

    def create(self, validated_data):
        validated_data.setdefault('username', validated_data['email'])
        user = User(**validated_data)
        user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and instance.pk == request.user.pk:
            if validated_data.get('role', instance.role) != instance.role and instance.role == User.UserRole.ADMIN:
                raise serializers.ValidationError({'role': "You can't remove your own administrator role."})
            if validated_data.get('is_active', True) is False:
                raise serializers.ValidationError({'is_active': "You can't deactivate your own account."})
        return super().update(instance, validated_data)


class InviteDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Invitation
        fields = ['user', 'status', 'expires_at']
        read_only_fields = fields


class AcceptInviteSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        try:
            invitation = Invitation.objects.select_related('user').get(
                token=attrs['token'], status=Invitation.Status.PENDING,
            )
        except Invitation.DoesNotExist:
            raise serializers.ValidationError({'token': 'This invitation link is invalid or has already been used.'})
        if invitation.expires_at < timezone.now():
            invitation.status = Invitation.Status.EXPIRED
            invitation.save(update_fields=['status'])
            raise serializers.ValidationError({'token': 'This invitation link has expired. Ask your administrator to resend it.'})
        try:
            validate_password(attrs['password'], invitation.user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        attrs['invitation'] = invitation
        return attrs

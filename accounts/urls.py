from django.urls import path
from .views import (
    RegisterView, LoginView, RefreshView, LogoutView, ProfileView, InstitutionListView,
    ChangePasswordView, PasswordResetRequestView, PasswordResetConfirmView,
    SessionListView, SessionRevokeView, AdminUserListView, AdminUserDetailView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', ProfileView.as_view(), name='auth-profile'),
    path('institutions/', InstitutionListView.as_view(), name='auth-institutions'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='auth-password-reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='auth-password-reset-confirm'),
    path('sessions/', SessionListView.as_view(), name='auth-sessions'),
    path('sessions/<int:pk>/', SessionRevokeView.as_view(), name='auth-session-revoke'),
    path('users/', AdminUserListView.as_view(), name='auth-users'),
    path('users/<int:pk>/', AdminUserDetailView.as_view(), name='auth-user-detail'),
]

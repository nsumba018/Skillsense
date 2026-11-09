import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import Invitation


INVITE_EXPIRY_HOURS = 48

ROLE_LABELS = {
    'admin': 'Administrator',
    'career_training_advisor': 'Career & Training Advisor',
    'education_curriculum_planner': 'Education / Curriculum Planner',
    'labor_market_analyst': 'Labour Market Analyst',
}


def generate_temp_password():
    """Random one-time password that satisfies Django's validators."""
    return secrets.token_urlsafe(9) + '#7'


def _send_invite_email(invitation, temp_password):
    user = invitation.user
    role_label = ROLE_LABELS.get(user.role, user.role)
    base = settings.FRONTEND_URL.rstrip('/')
    link = f"{base}/invite/login?token={invitation.token}"
    send_mail(
        "You've been invited to SkillSense",
        f"Hello {user.first_name or user.email},\n\n"
        f"An administrator has created a SkillSense account for you as a {role_label}.\n\n"
        f"Click this link to sign in and choose your password "
        f"(valid for {INVITE_EXPIRY_HOURS} hours):\n{link}\n\n"
        f"Or sign in manually at {base}/signin with:\n"
        f"Email: {user.email}\n"
        f"Temporary password: {temp_password}\n\n"
        f"You will be asked to choose a new password the first time you sign in.\n\n"
        f"If you didn't expect this invitation, you can ignore this email.",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
    )


def _issue_credentials(user, temp_password):
    user.set_password(temp_password)
    user.must_change_password = True
    user.is_active = True
    user.save(update_fields=['password', 'must_change_password', 'is_active'])


def create_invitation(user, invited_by, temp_password=None):
    """Give `user` a temporary password (admin-chosen or generated) and email it."""
    temp_password = temp_password or generate_temp_password()
    invitation = Invitation.objects.create(
        user=user,
        token=secrets.token_urlsafe(48),
        status=Invitation.Status.PENDING,
        expires_at=timezone.now() + timedelta(hours=INVITE_EXPIRY_HOURS),
        invited_by=invited_by,
    )
    _issue_credentials(user, temp_password)
    _send_invite_email(invitation, temp_password)
    return invitation


def resend_invitation(invitation):
    """Issue a fresh temporary password and email it again."""
    temp_password = generate_temp_password()
    invitation.token = secrets.token_urlsafe(48)
    invitation.expires_at = timezone.now() + timedelta(hours=INVITE_EXPIRY_HOURS)
    invitation.status = Invitation.Status.PENDING
    invitation.save(update_fields=['token', 'expires_at', 'status', 'updated_at'])
    _issue_credentials(invitation.user, temp_password)
    _send_invite_email(invitation, temp_password)
    return invitation

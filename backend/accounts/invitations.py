import secrets

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta

from .models import Invitation


INVITE_EXPIRY_HOURS = 48

ROLE_LABELS = {
    'admin': 'Administrator',
    'career_training_advisor': 'Career & Training Advisor',
    'education_curriculum_planner': 'Education / Curriculum Planner',
    'labor_market_analyst': 'Labour Market Analyst',
}


def _send_invite_email(invitation):
    user = invitation.user
    role_label = ROLE_LABELS.get(user.role, user.role)
    link = f"{settings.FRONTEND_URL.rstrip('/')}/invite/accept?token={invitation.token}"
    send_mail(
        'You\'ve been invited to SkillSense',
        f"Hello {user.first_name or user.email},\n\n"
        f"You've been invited to SkillSense as a {role_label}.\n\n"
        f"Click the link below to set your password and activate your account. "
        f"This link expires in {INVITE_EXPIRY_HOURS} hours.\n\n"
        f"{link}\n\n"
        f"If you didn't expect this invitation, you can ignore this email.",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
    )


def create_invitation(user, invited_by):
    token = secrets.token_urlsafe(48)
    invitation = Invitation.objects.create(
        user=user,
        token=token,
        status=Invitation.Status.PENDING,
        expires_at=timezone.now() + timedelta(hours=INVITE_EXPIRY_HOURS),
        invited_by=invited_by,
    )
    _send_invite_email(invitation)
    return invitation


def resend_invitation(invitation):
    invitation.token = secrets.token_urlsafe(48)
    invitation.expires_at = timezone.now() + timedelta(hours=INVITE_EXPIRY_HOURS)
    invitation.status = Invitation.Status.PENDING
    invitation.save(update_fields=['token', 'expires_at', 'status', 'updated_at'])
    _send_invite_email(invitation)
    return invitation

from django.utils import timezone
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken


def refresh_jti(raw_token):
    """jti of a raw refresh token, or None if it is missing/invalid."""
    if not raw_token:
        return None
    try:
        return RefreshToken(raw_token)['jti']
    except Exception:
        return None


def active_tokens(user):
    """Outstanding refresh tokens of a user that are neither expired nor blacklisted."""
    return OutstandingToken.objects.filter(
        user=user, expires_at__gt=timezone.now(),
    ).exclude(blacklistedtoken__isnull=False).order_by('-created_at')


def revoke_tokens(user, except_jti=None):
    """Blacklist every active refresh token of the user (optionally keeping one)."""
    count = 0
    for token in active_tokens(user):
        if token.jti != except_jti:
            BlacklistedToken.objects.get_or_create(token=token)
            count += 1
    return count

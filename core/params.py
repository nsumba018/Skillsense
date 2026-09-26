from rest_framework.exceptions import ValidationError


def int_param(params, name):
    """Read an optional integer query parameter; invalid values become a 400."""
    raw = params.get(name)
    if raw in (None, ''):
        return None
    try:
        return int(raw)
    except ValueError:
        raise ValidationError({name: 'Must be an integer.'})

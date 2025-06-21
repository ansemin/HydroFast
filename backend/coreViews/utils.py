from django.contrib.auth.models import User


def get_default_user():
    """Return the default user for anonymous actions."""
    return User.objects.get(username="default_user")

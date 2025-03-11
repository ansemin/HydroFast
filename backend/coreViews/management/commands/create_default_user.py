from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = "Create a default user for development or testing."

    def handle(self, *args, **kwargs):
        username = "default_user"
        password = "default_password"
        email = "default@example.com"

        # Check if the default user already exists
        if not User.objects.filter(username=username).exists():
            User.objects.create_user(
                username=username,
                password=password,
                email=email,
            )
            self.stdout.write(
                self.style.SUCCESS(f"Default user '{username}' created with password '{password}'.")
            )
        else:
            self.stdout.write(
                self.style.WARNING(f"Default user '{username}' already exists.")
            )

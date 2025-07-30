import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.authentication.models import UserProfile
from dotenv import load_dotenv
from django.conf import settings

class Command(BaseCommand):
    help = 'Create default users from .env file if they do not exist'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete existing default users before creating new ones.',
        )

    def handle(self, *args, **options):
        # Load environment variables from the .env file in the project root
        env_path = settings.BASE_DIR.parent / '.env'
        load_dotenv(dotenv_path=env_path)

        # Get credentials from environment variables
        admin_username = os.getenv('DEFAULT_ADMIN_USERNAME', 'admin')
        admin_password = os.getenv('DEFAULT_ADMIN_PASSWORD')
        
        default_username = os.getenv('DEFAULT_USER_USERNAME', 'default_user')
        default_password = os.getenv('DEFAULT_USER_PASSWORD')

        if not admin_password or not default_password:
            self.stdout.write(self.style.ERROR(
                'DEFAULT_ADMIN_PASSWORD and DEFAULT_USER_PASSWORD must be set in the .env file.'
            ))
            return

        # Clear existing users if requested
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing default users...'))
            User.objects.filter(username__in=[admin_username, default_username]).delete()
            self.stdout.write(self.style.SUCCESS('Users cleared.'))

        # Create admin user
        if not User.objects.filter(username=admin_username).exists():
            admin_user = User.objects.create_user(
                username=admin_username,
                email=f'{admin_username}@example.com',
                password=admin_password
            )
            UserProfile.objects.create(user=admin_user, is_admin=True)
            self.stdout.write(self.style.SUCCESS(
                f'Admin user "{admin_username}" created with password from .env file.'
            ))
        else:
            self.stdout.write(self.style.WARNING(f'Admin user "{admin_username}" already exists.'))

        # Create default user
        if not User.objects.filter(username=default_username).exists():
            user = User.objects.create_user(
                username=default_username,
                email=f'{default_username}@example.com',
                password=default_password
            )
            UserProfile.objects.create(user=user, is_admin=False) # Default user is not an admin
            self.stdout.write(self.style.SUCCESS(
                f'Default user "{default_username}" created with password from .env file.'
            ))
        else:
            self.stdout.write(self.style.WARNING(f'Default user "{default_username}" already exists.'))
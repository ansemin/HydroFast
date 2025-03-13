from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from coreViews.models import UserProfile
from rest_framework.authtoken.models import Token

class Command(BaseCommand):
    help = 'Creates a default user for testing'

    def handle(self, *args, **options):
        username = 'admin'
        email = 'admin@example.com'
        password = 'admin123'
        
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'User {username} already exists'))
            user = User.objects.get(username=username)
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(f'User {username} created successfully'))
        
        # Create or get user profile
        if hasattr(user, 'userprofile'):
            user.userprofile.is_admin = True
            user.userprofile.save()
            self.stdout.write(self.style.SUCCESS(f'User profile updated'))
        else:
            UserProfile.objects.create(user=user, is_admin=True)
            self.stdout.write(self.style.SUCCESS(f'User profile created'))
        
        # Create or get token
        token, created = Token.objects.get_or_create(user=user)
        if created:
            self.stdout.write(self.style.SUCCESS(f'Token created: {token.key}'))
        else:
            self.stdout.write(self.style.WARNING(f'Token already exists: {token.key}'))
        
        self.stdout.write(self.style.SUCCESS(f'Default user setup complete'))
        self.stdout.write(self.style.SUCCESS(f'Username: {username}'))
        self.stdout.write(self.style.SUCCESS(f'Password: {password}'))
        self.stdout.write(self.style.SUCCESS(f'Token: {token.key}'))

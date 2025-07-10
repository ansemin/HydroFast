from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.authentication.models import UserProfile

class Command(BaseCommand):
    help = 'Create a default user if it does not exist'

    def handle(self, *args, **options):
        # Create admin user for frontend login
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_user(
                username='admin',
                email='admin@example.com',
                password='admin'
            )
            UserProfile.objects.create(user=admin_user, is_admin=True)
            self.stdout.write(self.style.SUCCESS('Admin user "admin" created with password "admin".'))
        else:
            self.stdout.write(self.style.WARNING('Admin user already exists.'))
        
        # Create default user as backup
        if not User.objects.filter(username='default_user').exists():
            user = User.objects.create_user(
                username='default_user',
                email='default@example.com',
                password='default_password'
            )
            UserProfile.objects.create(user=user, is_admin=True)
            self.stdout.write(self.style.SUCCESS('Default user "default_user" created with password "default_password".'))
        else:
            self.stdout.write(self.style.WARNING('Default user already exists.'))

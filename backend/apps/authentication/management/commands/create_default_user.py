from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.authentication.models import UserProfile

class Command(BaseCommand):
    help = 'Create a default user if it does not exist'

    def handle(self, *args, **options):
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

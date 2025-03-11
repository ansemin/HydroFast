import random
from django.core.management.base import BaseCommand
from coreViews.models import Patient
from django.contrib.auth.models import User


class Command(BaseCommand):
    """
    python manage.py generate_patients --count=5
    """
    help = "Generate random patients with common Singaporean names and unique NRICs."

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help="Number of random patients to create (default is 10)."
        )

    def handle(self, *args, **kwargs):
        count = kwargs['count']

        # Ensure a default user exists
        default_user, created = User.objects.get_or_create(
            username="default_user",
            defaults={"email": "default@example.com", "password": "default_password"}
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Default user 'default_user' created."))
        else:
            self.stdout.write(self.style.WARNING("Default user 'default_user' already exists."))

        # List of common Singaporean first and last names
        first_names = [
            "David", "John", "Kimberly", "Wei Ling", "Jia Hao", "Amanda",
            "Shi Min", "Zhi Hao", "Sarah", "Kai Wei", "Benjamin", "Grace",
            "Yi Xuan", "Jun Wei", "Cheryl", "Xin Yi", "Nicole", "Hui Ying",
            "Ryan", "Jolene", "Liang Wei", "Marcus", "Tiffany", "Jia Ying"
        ]

        last_names = [
            "Tan", "Neo", "Lim", "Ng", "Lee", "Chong", "Wong", "Goh",
            "Chua", "Teo", "Yeo", "Chan", "Ho", "Cheong", "Sim", "Pang",
            "Foo", "Koh", "Seah", "Ong", "Loh", "Toh", "Heng", "Tay"
        ]

        # Generate random patients
        for _ in range(count):
            # Pick random first and last names
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)

            # Generate a unique NRIC
            nric = self.generate_unique_nric()

            # Create the patient
            Patient.objects.create(
                user=default_user,
                first_name=first_name,
                last_name=last_name,
                nric=nric,
                contact_no=f"12345{random.randint(100, 999)}",  # Random contact number
                details="Randomly generated patient.",
            )

        self.stdout.write(self.style.SUCCESS(f"Successfully created {count} random patients."))

    def generate_unique_nric(self):
        """
        Generates a unique NRIC that does not already exist in the database.
        """
        while True:
            nric = f"SX{random.randint(1000, 9999)}X{random.randint(1, 9)}F"
            if not Patient.objects.filter(nric=nric).exists():
                return nric

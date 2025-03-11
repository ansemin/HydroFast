import random
import uuid  # For generating unique file names
from django.core.management.base import BaseCommand
from coreViews.models import Patient, Scan
from django.core.files.base import ContentFile
import base64

class Command(BaseCommand):
    """
    python manage.py create_scans --count=3
    """
    help = "Generate random scans for existing patients in the database."

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help="Number of scans to create (default is 10)."
        )

    def handle(self, *args, **kwargs):
        count = kwargs['count']

        # Get all patients
        patients = Patient.objects.all()
        if not patients.exists():
            self.stdout.write(self.style.ERROR("No patients found in the database."))
            return

        # Create scans
        for _ in range(count):
            # Select a random patient
            patient = random.choice(patients)

            # Generate a random unique file name for the image
            unique_filename = f"scan_{uuid.uuid4().hex}.png"

            # Generate a random image file (placeholder content for this example)
            image_content = base64.b64decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAUA" +
                "AAAFCAYAAACNbyblAAAAHElEQVQI12P4" +
                "//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
            )  # Example base64-encoded image
            image_file = ContentFile(image_content, name=unique_filename)

            # Create the scan
            scan = Scan.objects.create(
                user=patient.user,  # Associate the scan with the patient's user
                patient=patient,
                image=image_file,
                is_processed=False,
            )

            self.stdout.write(self.style.SUCCESS(f"Created scan for patient {patient.first_name} {patient.last_name} (ID: {patient.id})."))

        self.stdout.write(self.style.SUCCESS(f"Successfully created {count} scans."))

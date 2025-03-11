
from django.core.management.base import BaseCommand
from coreViews.models import Patient

class Command(BaseCommand):
    """
    This management command allows you to delete patients in three ways:

    1. Delete All Patients:
    Use the `--all` argument to delete all patients in the database.
    Example:
        python manage.py delete_patients --all

    2. Delete Patients with a Filter:
    Use the `--filter` argument to specify a field=value pair for filtering patients to delete.
    Example:
        python manage.py delete_patients --filter="first_name=John"

    3. Delete a Single Patient by ID:
    Use the `--id` argument to delete a single patient by their ID.
    Example:
        python manage.py delete_patients --id=1

    If no valid argument is provided, the command will display an error and a prompt to specify --all, --filter, or --id.
    """

    help = "Delete patients based on filters or delete all."

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Delete all patients.',
        )
        parser.add_argument(
            '--filter',
            type=str,
            help='Filter patients by field=value (e.g., first_name=John).',
        )
        parser.add_argument(
            '--id',
            type=int,
            help='Delete a single patient by ID.',
        )

    def handle(self, *args, **kwargs):
        if kwargs['all']:
            # Delete all patients
            count, _ = Patient.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS(f"Deleted {count} patients.")
            )

        elif kwargs['filter']:
            # Delete patients by filter
            try:
                field, value = kwargs['filter'].split('=')
                patients = Patient.objects.filter(**{field: value})
                count = patients.count()
                patients.delete()
                self.stdout.write(
                    self.style.SUCCESS(f"Deleted {count} patients where {field}={value}.")
                )
            except ValueError:
                self.stdout.write(
                    self.style.ERROR("Invalid filter format. Use field=value (e.g., first_name=John).")
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"An error occurred: {e}")
                )

        elif kwargs['id']:
            # Delete a single patient by ID
            try:
                patient = Patient.objects.get(id=kwargs['id'])
                patient.delete()
                self.stdout.write(
                    self.style.SUCCESS(f"Deleted patient with ID {kwargs['id']}.")
                )
            except Patient.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"No patient found with ID {kwargs['id']}.")
                )

        else:
            # No argument provided
            self.stdout.write(
                self.style.ERROR("Please specify --all, --filter, or --id.")
            )

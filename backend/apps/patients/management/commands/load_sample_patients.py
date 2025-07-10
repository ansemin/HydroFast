import json
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.patients.models import Patient
from django.db import transaction

class Command(BaseCommand):
    help = 'Load sample patient data into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear', 
            action='store_true', 
            help='Clear existing patients before loading sample data'
        )
        parser.add_argument(
            '--user', 
            type=str, 
            default='admin',
            help='Username to assign as the creator of these patients (default: admin)'
        )

    def handle(self, *args, **options):
        # Sample data provided by the user
        sample_data = [
            {"First Name": "Randall", "Last Name": "Stuart", "NRIC/Passport No.": "F1049816X", "Contact No.": ""},
            {"First Name": "Zachary", "Last Name": "Gibson", "NRIC/Passport No.": "F2767763O", "Contact No.": ""},
            {"First Name": "Stephen", "Last Name": "Aguirre", "NRIC/Passport No.": "G0190838O", "Contact No.": "+1-368-478-8600"},
            {"First Name": "Kevin", "Last Name": "Allen", "NRIC/Passport No.": "F5424329U", "Contact No.": "943-963-5933"},
            {"First Name": "Amanda", "Last Name": "Obrien", "NRIC/Passport No.": "T1095206P", "Contact No.": ""},
            {"First Name": "Samantha", "Last Name": "Li", "NRIC/Passport No.": "F1772409D", "Contact No.": "001-610-415-1471x832"},
            {"First Name": "Matthew", "Last Name": "Carey", "NRIC/Passport No.": "G3150295L", "Contact No.": ""},
            {"First Name": "Brandon", "Last Name": "Spencer", "NRIC/Passport No.": "S1548857X", "Contact No.": ""},
            {"First Name": "Emily", "Last Name": "Martin", "NRIC/Passport No.": "G6401263O", "Contact No.": "(055)808-3201x383"},
            {"First Name": "Brenda", "Last Name": "Chase", "NRIC/Passport No.": "T3861700X", "Contact No.": "001-889-898-5753"},
            {"First Name": "Allison", "Last Name": "Torres", "NRIC/Passport No.": "S0560308M", "Contact No.": "030.915.3358x11759"},
            {"First Name": "Kevin", "Last Name": "Lamb", "NRIC/Passport No.": "S0539298G", "Contact No.": "(026)607-6077x563"},
            {"First Name": "John", "Last Name": "Lang", "NRIC/Passport No.": "F7964788C", "Contact No.": ""},
            {"First Name": "Gary", "Last Name": "Leonard", "NRIC/Passport No.": "G5545802Z", "Contact No.": ""},
            {"First Name": "Amanda", "Last Name": "Hudson", "NRIC/Passport No.": "S3197348U", "Contact No.": "+1-418-809-1573"},
            {"First Name": "Vanessa", "Last Name": "Patterson", "NRIC/Passport No.": "G0421792N", "Contact No.": ""},
            {"First Name": "Benjamin", "Last Name": "Dickson", "NRIC/Passport No.": "G1525013W", "Contact No.": "758-414-0750x6775"},
            {"First Name": "Lori", "Last Name": "Hunter", "NRIC/Passport No.": "T3210082Z", "Contact No.": ""},
            {"First Name": "Christina", "Last Name": "Simpson", "NRIC/Passport No.": "F9304947S", "Contact No.": "355-278-8950"},
            {"First Name": "Bonnie", "Last Name": "Solomon", "NRIC/Passport No.": "G9815244E", "Contact No.": ""}
        ]

        # Get the user who will be assigned as the creator
        try:
            user = User.objects.get(username=options['user'])
            self.stdout.write(
                self.style.SUCCESS(f'Using user: {user.username}')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{options["user"]}" not found. Please create the user first or use --user to specify a different username.')
            )
            return

        # Clear existing patients if requested
        if options['clear']:
            with transaction.atomic():
                deleted_count = Patient.objects.count()
                Patient.objects.all().delete()
                self.stdout.write(
                    self.style.WARNING(f'Deleted {deleted_count} existing patients')
                )

        # Load sample data
        created_count = 0
        updated_count = 0
        error_count = 0

        with transaction.atomic():
            for patient_data in sample_data:
                try:
                    # Map the JSON keys to model fields
                    first_name = patient_data["First Name"]
                    last_name = patient_data["Last Name"]
                    nric = patient_data["NRIC/Passport No."]
                    contact_no = patient_data["Contact No."] or None  # Convert empty string to None
                    
                    # Try to get existing patient by NRIC
                    patient, created = Patient.objects.get_or_create(
                        nric=nric,
                        defaults={
                            'user': user,
                            'first_name': first_name,
                            'last_name': last_name,
                            'contact_no': contact_no,
                        }
                    )
                    
                    if created:
                        created_count += 1
                        self.stdout.write(f'Created: {first_name} {last_name} ({nric})')
                    else:
                        # Update existing patient
                        patient.first_name = first_name
                        patient.last_name = last_name
                        patient.contact_no = contact_no
                        patient.save()
                        updated_count += 1
                        self.stdout.write(f'Updated: {first_name} {last_name} ({nric})')
                        
                except Exception as e:
                    error_count += 1
                    self.stderr.write(
                        self.style.ERROR(f'Error processing {patient_data}: {str(e)}')
                    )

        # Print summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSample data loading completed!\n'
                f'Created: {created_count} patients\n'
                f'Updated: {updated_count} patients\n'
                f'Errors: {error_count} patients\n'
                f'Total processed: {len(sample_data)} patients'
            )
        ) 
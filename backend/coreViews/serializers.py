from rest_framework import serializers
from .models import Patient, Scan, AIModel

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'nric', 'date_of_birth', 'contact_no', 'details']

# class ScanSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Scan
#         fields = "__all__"

class ScanSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source="user.username") 
    patient_name = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()

    # date = serializers.DateField(source='created_at', format='%Y-%m-%d')
    # time = serializers.TimeField(source='created_at', format='%H:%M:%S')
    
    class Meta:
        model = Scan
        fields = ['id', 'user', 'patient', 'patient_name', 'image', 'is_processed', 'date', 'time']


    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def get_date(self, obj):
        return obj.created_at.date()  

    def get_time(self, obj):
        return obj.created_at.time().strftime('%H:%M:%S')

class AIModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModel
        fields = "__all__"

from rest_framework import serializers
from .models import Scan

class ScanSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source="user.username") 
    patient_name = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    
    class Meta:
        model = Scan
        fields = ['id', 'user', 'patient', 'patient_name', 'image', 'is_processed', 'date', 'time']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def get_date(self, obj):
        return obj.created_at.date()  

    def get_time(self, obj):
        return obj.created_at.time().strftime('%H:%M:%S')

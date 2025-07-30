from rest_framework import serializers
from .models import Scan, ScanResult

class ScanResultSerializer(serializers.ModelSerializer):
    scan_id = serializers.ReadOnlyField(source='scan.id')
    patient_name = serializers.SerializerMethodField()
    scan_date = serializers.SerializerMethodField()
    file_sizes = serializers.SerializerMethodField()
    
    class Meta:
        model = ScanResult
        fields = [
            'id', 'scan_id', 'patient_name', 'scan_date',
            'stl_file', 'depth_map_8bit', 'depth_map_16bit', 'preview_image',
            'volume_estimate', 'processing_metadata', 'file_sizes',
            'created_at', 'updated_at'
        ]
    
    def get_patient_name(self, obj):
        if obj.scan and obj.scan.patient:
            return f"{obj.scan.patient.first_name} {obj.scan.patient.last_name}"
        return "Unknown"
    
    def get_scan_date(self, obj):
        if obj.scan:
            return obj.scan.created_at
        return None
    
    def get_file_sizes(self, obj):
        """Get file sizes in MB"""
        import logging
        logger = logging.getLogger(__name__)
        
        sizes = {}
        for field_name in ['stl_file', 'depth_map_8bit', 'depth_map_16bit', 'preview_image']:
            field = getattr(obj, field_name)
            if field and field.name:  # Check if field has a name (file path)
                try:
                    # Try to access the file size
                    file_size = field.size
                    sizes[field_name] = round(file_size / (1024 * 1024), 2)  # Convert to MB
                except (OSError, IOError, FileNotFoundError) as e:
                    # File doesn't exist on disk, set size as 0
                    logger.warning(f"File {field.name} not found on disk for scan result {obj.id}: {e}")
                    sizes[field_name] = 0.0
                except Exception as e:
                    # Handle any other unexpected errors
                    logger.error(f"Unexpected error accessing file {field.name} for scan result {obj.id}: {e}")
                    sizes[field_name] = 0.0
            else:
                # No file uploaded for this field
                sizes[field_name] = 0.0
        return sizes


class ScanSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source="user.username") 
    patient_name = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    has_results = serializers.SerializerMethodField()
    scan_attempt_number = serializers.ReadOnlyField()
    result = ScanResultSerializer(read_only=True)
    
    class Meta:
        model = Scan
        fields = ['id', 'user', 'patient', 'patient_name', 'image', 'is_processed', 
                  'date', 'time', 'has_results', 'scan_attempt_number', 'result', 'created_at']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def get_date(self, obj):
        return obj.created_at.date()  

    def get_time(self, obj):
        return obj.created_at.time().strftime('%H:%M:%S')
    
    def get_has_results(self, obj):
        """Check if scan has results with actual STL file"""
        try:
            result = obj.result
            return bool(result.stl_file and result.stl_file.name)
        except:
            return False

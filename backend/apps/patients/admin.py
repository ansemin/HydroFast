from django.contrib import admin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'nric', 'user', 'date_of_birth')
    list_filter = ('user', 'date_of_birth')
    search_fields = ('first_name', 'last_name', 'nric', 'user__username')
    readonly_fields = ('user',)
    fieldsets = (
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'nric', 'date_of_birth')
        }),
        ('Contact Information', {
            'fields': ('contact_no',)
        }),
        ('Additional Details', {
            'fields': ('details',)
        }),
        ('System Information', {
            'fields': ('user',)
        }),
    )

from django.contrib.gis import admin
from .models import Report


class CustomGeoModelAdmin(admin.GISModelAdmin):
    list_display = ['report_id', '__str__',
                    'county',
                    'claimed_by', 'created_on']
    list_display_links = ['__str__']
    list_filter = ['has_specimen',
                   'county',
                   'edrr_status',
                   'is_archived', 'is_public',
                   'actual_species']


admin.site.register(Report, CustomGeoModelAdmin)

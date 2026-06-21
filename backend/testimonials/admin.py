from django.contrib import admin

from .models import Scholar


@admin.register(Scholar)
class ScholarAdmin(admin.ModelAdmin):
    list_display = ["full_name", "school", "degree_name", "latin_honor", "order", "created_at"]
    search_fields = ["first_name", "last_name", "school", "degree_name"]

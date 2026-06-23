from django.contrib import admin

from .models import Degree, Scholar, School


@admin.register(Scholar)
class ScholarAdmin(admin.ModelAdmin):
    list_display = [
        "full_name",
        "school_display",
        "degree_display",
        "year_graduated",
        "latin_honor",
        "order",
        "created_at",
    ]
    search_fields = [
        "first_name",
        "last_name",
        "school",
        "school_ref__name",
        "degree_name",
        "degree_ref__name",
    ]

    @admin.display(description="School")
    def school_display(self, obj):
        return obj.school_ref.name if obj.school_ref else obj.school

    @admin.display(description="Degree")
    def degree_display(self, obj):
        return obj.degree_ref.name if obj.degree_ref else obj.degree_name


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ["name", "region", "created_at", "updated_at"]
    search_fields = ["name"]
    list_filter = ["region"]

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Degree)
class DegreeAdmin(admin.ModelAdmin):
    list_display = ["name", "region", "created_at", "updated_at"]
    search_fields = ["name"]
    list_filter = ["region"]

    def has_delete_permission(self, request, obj=None):
        return False

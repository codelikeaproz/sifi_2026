from rest_framework import serializers

from .models import LatinHonor, Region, Scholar


class ScholarSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name", read_only=True)
    degreeName = serializers.CharField(source="degree_name", read_only=True)
    schoolName = serializers.CharField(source="school", read_only=True)
    latinHonor = serializers.CharField(source="latin_honor", read_only=True)
    latinHonorLabel = serializers.SerializerMethodField()
    regionLabel = serializers.SerializerMethodField()
    imageSrc = serializers.SerializerMethodField()
    thumbnailSrc = serializers.SerializerMethodField()
    name = serializers.CharField(source="full_name", read_only=True)
    affiliation = serializers.CharField(source="school", read_only=True)
    quote = serializers.CharField(source="message", read_only=True)

    class Meta:
        model = Scholar
        fields = [
            "id",
            "first_name",
            "last_name",
            "middle_initial",
            "suffix",
            "fullName",
            "school",
            "schoolName",
            "degree_name",
            "degreeName",
            "region",
            "regionLabel",
            "latin_honor",
            "latinHonor",
            "latinHonorLabel",
            "message",
            "image",
            "imageSrc",
            "thumbnailSrc",
            "name",
            "affiliation",
            "quote",
            "order",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "fullName",
            "schoolName",
            "degreeName",
            "regionLabel",
            "latinHonor",
            "latinHonorLabel",
            "imageSrc",
            "thumbnailSrc",
            "name",
            "affiliation",
            "quote",
            "order",
            "created_at",
        ]
        extra_kwargs = {"image": {"required": False}}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if (
            not self.partial
            and self.context.get("request")
            and self.context["request"].method == "POST"
        ):
            self.fields["image"].required = True

    def get_latinHonorLabel(self, obj):
        if not obj.latin_honor:
            return ""
        return LatinHonor(obj.latin_honor).label

    def get_regionLabel(self, obj):
        if not obj.region:
            return ""
        return Region(obj.region).label

    def get_imageSrc(self, obj):
        return self._absolute_url(obj.image)

    def get_thumbnailSrc(self, obj):
        if obj.thumbnail:
            return self._absolute_url(obj.thumbnail)
        return self._absolute_url(obj.image)

    def _absolute_url(self, field):
        if not field:
            return ""
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(field.url)
        return field.url

    def validate_region(self, value):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return value

        from .profile_utils import get_assigned_region, is_admin

        if is_admin(request.user):
            return value

        assigned = get_assigned_region(request.user)
        if assigned and value != assigned:
            raise serializers.ValidationError(
                "You can only manage scholars in your assigned region."
            )
        return value

from datetime import datetime

from rest_framework import serializers

from .models import Degree, LatinHonor, Region, Scholar, School


def _current_year():
    return datetime.now().year


def _get_or_create_region_record(model, *, region, name):
    cleaned = name.strip()
    existing = model.objects.filter(region=region, name__iexact=cleaned).first()
    if existing:
        return existing
    return model.objects.create(region=region, name=cleaned)


class RegionScopedNameSerializer(serializers.ModelSerializer):
    scholarCount = serializers.SerializerMethodField()

    class Meta:
        fields = ["id", "name", "region", "created_at", "updated_at", "scholarCount"]
        read_only_fields = ["id", "created_at", "updated_at", "scholarCount"]

    def validate_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("This field may not be blank.")

        model = self.Meta.model
        region = self.initial_data.get("region")
        if region is None and self.instance is not None:
            region = self.instance.region
        if region is None:
            raise serializers.ValidationError("Region is required.")

        queryset = model.objects.filter(region=region, name__iexact=cleaned)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                f"{model.__name__} already exists in this region."
            )
        return cleaned

    def get_scholarCount(self, obj):
        return obj.scholars.count()

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
                "You can only manage records in your assigned region."
            )
        return value


class SchoolSerializer(RegionScopedNameSerializer):
    class Meta(RegionScopedNameSerializer.Meta):
        model = School


class DegreeSerializer(RegionScopedNameSerializer):
    class Meta(RegionScopedNameSerializer.Meta):
        model = Degree


class ScholarSerializer(serializers.ModelSerializer):
    school_id = serializers.PrimaryKeyRelatedField(
        source="school_ref",
        queryset=School.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    degree_id = serializers.PrimaryKeyRelatedField(
        source="degree_ref",
        queryset=Degree.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    schoolRefId = serializers.IntegerField(source="school_ref_id", read_only=True)
    degreeRefId = serializers.IntegerField(source="degree_ref_id", read_only=True)
    fullName = serializers.CharField(source="full_name", read_only=True)
    degreeName = serializers.SerializerMethodField()
    schoolName = serializers.SerializerMethodField()
    latinHonor = serializers.CharField(source="latin_honor", read_only=True)
    latinHonorLabel = serializers.SerializerMethodField()
    regionLabel = serializers.SerializerMethodField()
    imageSrc = serializers.SerializerMethodField()
    thumbnailSrc = serializers.SerializerMethodField()
    name = serializers.CharField(source="full_name", read_only=True)
    affiliation = serializers.SerializerMethodField()
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
            "school_id",
            "schoolRefId",
            "school",
            "schoolName",
            "degree_id",
            "degreeRefId",
            "degree_name",
            "degreeName",
            "region",
            "regionLabel",
            "latin_honor",
            "latinHonor",
            "latinHonorLabel",
            "message",
            "year_graduated",
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
            "schoolRefId",
            "schoolName",
            "degreeRefId",
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

    def get_schoolName(self, obj):
        return obj.school_ref.name if obj.school_ref else obj.school

    def get_degreeName(self, obj):
        return obj.degree_ref.name if obj.degree_ref else obj.degree_name

    def get_regionLabel(self, obj):
        if not obj.region:
            return ""
        return Region(obj.region).label

    def get_affiliation(self, obj):
        return self.get_schoolName(obj)

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

    def validate_year_graduated(self, value):
        if value is None:
            return value
        current_year = _current_year() + 1
        if value < 1900 or value > current_year:
            raise serializers.ValidationError(
                f"Enter a year between 1900 and {current_year}."
            )
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)

        region = attrs.get("region")
        if region is None and self.instance is not None:
            region = self.instance.region

        school_ref = attrs.get("school_ref")
        degree_ref = attrs.get("degree_ref")

        if school_ref and region and school_ref.region != region:
            raise serializers.ValidationError(
                {"school_id": "Selected school must belong to the same region."}
            )
        if degree_ref and region and degree_ref.region != region:
            raise serializers.ValidationError(
                {"degree_id": "Selected degree must belong to the same region."}
            )

        return attrs

    def _resolve_region_scoped_value(
        self,
        *,
        validated_data,
        instance,
        relation_field,
        legacy_field,
        model,
        region,
    ):
        relation = validated_data.get(relation_field)
        legacy_value = validated_data.get(legacy_field)

        if relation is not None:
            validated_data[legacy_field] = relation.name
            return

        if isinstance(legacy_value, str) and legacy_value.strip():
            record = _get_or_create_region_record(
                model,
                region=region,
                name=legacy_value,
            )
            validated_data[relation_field] = record
            validated_data[legacy_field] = record.name
            return

        if instance is not None and region and getattr(instance, relation_field):
            current_relation = getattr(instance, relation_field)
            current_text = getattr(instance, legacy_field)
            if current_relation.region != region and current_text.strip():
                record = _get_or_create_region_record(
                    model,
                    region=region,
                    name=current_text,
                )
                validated_data[relation_field] = record
                validated_data[legacy_field] = record.name

    def create(self, validated_data):
        region = validated_data.get("region", Region.MINDANAO)
        self._resolve_region_scoped_value(
            validated_data=validated_data,
            instance=None,
            relation_field="school_ref",
            legacy_field="school",
            model=School,
            region=region,
        )
        self._resolve_region_scoped_value(
            validated_data=validated_data,
            instance=None,
            relation_field="degree_ref",
            legacy_field="degree_name",
            model=Degree,
            region=region,
        )
        return super().create(validated_data)

    def update(self, instance, validated_data):
        region = validated_data.get("region", instance.region)
        self._resolve_region_scoped_value(
            validated_data=validated_data,
            instance=instance,
            relation_field="school_ref",
            legacy_field="school",
            model=School,
            region=region,
        )
        self._resolve_region_scoped_value(
            validated_data=validated_data,
            instance=instance,
            relation_field="degree_ref",
            legacy_field="degree_name",
            model=Degree,
            region=region,
        )
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["school"] = self.get_schoolName(instance)
        data["schoolName"] = self.get_schoolName(instance)
        data["degree_name"] = self.get_degreeName(instance)
        data["degreeName"] = self.get_degreeName(instance)
        data["affiliation"] = self.get_affiliation(instance)
        return data

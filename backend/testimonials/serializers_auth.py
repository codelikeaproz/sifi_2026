from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Region, UserProfile, UserRole
from .profile_utils import get_user_profile


def profile_payload(user):
    profile = get_user_profile(user)
    if not profile:
        return {
            "username": user.username,
            "role": None,
            "region": None,
            "regionLabel": "",
        }
    region_label = ""
    if profile.region:
        region_label = Region(profile.region).label
    return {
        "username": user.username,
        "role": profile.role,
        "region": profile.region or None,
        "regionLabel": region_label,
    }


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data.update(profile_payload(self.user))
        return data


class MeSerializer(serializers.Serializer):
    username = serializers.CharField()
    role = serializers.CharField(allow_null=True)
    region = serializers.CharField(allow_null=True)
    regionLabel = serializers.CharField()


class ManagedUserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=UserRole.choices, write_only=True)
    region = serializers.ChoiceField(
        choices=Region.choices, required=False, allow_blank=True, write_only=True
    )
    password = serializers.CharField(write_only=True, required=False, min_length=6)
    roleDisplay = serializers.SerializerMethodField()
    regionLabel = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "role",
            "roleDisplay",
            "region",
            "regionLabel",
            "password",
        ]
        read_only_fields = ["id", "roleDisplay", "regionLabel"]

    def get_roleDisplay(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile:
            return ""
        return profile.get_role_display()

    def get_regionLabel(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile or not profile.region:
            return ""
        return Region(profile.region).label

    def to_representation(self, instance):
        profile = getattr(instance, "profile", None)
        return {
            "id": instance.id,
            "username": instance.username,
            "role": profile.role if profile else None,
            "roleDisplay": profile.get_role_display() if profile else "",
            "region": profile.region or None if profile else None,
            "regionLabel": Region(profile.region).label if profile and profile.region else "",
        }

    def validate(self, attrs):
        role = attrs.get("role")
        region = attrs.get("region", "")
        if role == UserRole.HEAD_OFFICER and not region:
            raise serializers.ValidationError(
                {"region": "Region is required for Head Officer."}
            )
        if role == UserRole.ADMIN:
            attrs["region"] = ""
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError(
                {"password": "Password is required for new users."}
            )
        if self.instance is not None and "role" in attrs:
            profile = getattr(self.instance, "profile", None)
            if (
                profile
                and profile.role == UserRole.ADMIN
                and attrs["role"] == UserRole.HEAD_OFFICER
                and UserProfile.objects.filter(role=UserRole.ADMIN).count() <= 1
            ):
                raise serializers.ValidationError(
                    {"role": "Cannot change the only admin to Head Officer."}
                )
        return attrs

    def create(self, validated_data):
        role = validated_data.pop("role")
        region = validated_data.pop("region", "")
        password = validated_data.pop("password")
        user = User.objects.create_user(
            username=validated_data["username"],
            password=password,
        )
        UserProfile.objects.create(user=user, role=role, region=region or "")
        return user

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        region = validated_data.pop("region", None)
        password = validated_data.pop("password", None)

        if "username" in validated_data:
            instance.username = validated_data["username"]
        if password:
            instance.set_password(password)
        instance.save()

        profile = getattr(instance, "profile", None)
        if not profile:
            profile = UserProfile.objects.create(
                user=instance,
                role=role or UserRole.HEAD_OFFICER,
                region=region or "",
            )
        else:
            if role is not None:
                profile.role = role
            if region is not None:
                profile.region = region if role != UserRole.ADMIN else ""
            elif role == UserRole.ADMIN:
                profile.region = ""
            profile.save()

        return instance

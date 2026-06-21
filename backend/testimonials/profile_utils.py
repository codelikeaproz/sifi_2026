from .models import UserProfile, UserRole


def get_user_profile(user):
    if not user or not user.is_authenticated:
        return None
    return UserProfile.objects.filter(user=user).first()


def is_admin(user):
    profile = get_user_profile(user)
    return profile is not None and profile.role == UserRole.ADMIN


def get_assigned_region(user):
    profile = get_user_profile(user)
    if not profile or profile.role != UserRole.HEAD_OFFICER:
        return None
    return profile.region or None

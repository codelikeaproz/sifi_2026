from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from testimonials.models import UserProfile, UserRole


class Command(BaseCommand):
    help = "Ensure superusers and staff have Admin UserProfile records"

    def handle(self, *args, **options):
        count = 0
        for user in User.objects.filter(is_superuser=True):
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={"role": UserRole.ADMIN, "region": ""},
            )
            if not created and profile.role != UserRole.ADMIN:
                profile.role = UserRole.ADMIN
                profile.region = ""
                profile.save()
            count += 1
            self.stdout.write(f"Admin profile ensured for: {user.username}")

        if count == 0:
            self.stdout.write("No superusers found.")

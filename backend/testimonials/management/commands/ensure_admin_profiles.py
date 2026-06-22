import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from testimonials.models import UserProfile, UserRole


class Command(BaseCommand):
    help = "Ensure superusers and staff have Admin UserProfile records"

    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "").strip()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip()

        if username and password:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "is_staff": True,
                    "is_superuser": True,
                },
            )
            user.email = email
            user.is_staff = True
            user.is_superuser = True
            user.set_password(password)
            user.save()
            action = "Created" if created else "Updated"
            self.stdout.write(f"{action} env superuser: {user.username}")
        elif username or password:
            self.stdout.write(
                "Skipping env superuser: set both DJANGO_SUPERUSER_USERNAME and "
                "DJANGO_SUPERUSER_PASSWORD."
            )

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

import logging
from io import BytesIO

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.db import models
from django.db.models import Max
from PIL import Image

logger = logging.getLogger(__name__)


class LatinHonor(models.TextChoices):
    NONE = "", "None"
    CUM_LAUDE = "cum_laude", "Cum Laude"
    MAGNA_CUM_LAUDE = "magna_cum_laude", "Magna Cum Laude"
    SUMMA_CUM_LAUDE = "summa_cum_laude", "Summa Cum Laude"


class Region(models.TextChoices):
    LUZON = "luzon", "Luzon"
    VISAYAS = "visayas", "Visayas"
    MINDANAO = "mindanao", "Mindanao"


class UserRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    HEAD_OFFICER = "head_officer", "Head Officer"


class Scholar(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_initial = models.CharField(max_length=10, blank=True)
    suffix = models.CharField(max_length=20, blank=True)
    school = models.CharField(max_length=200)
    degree_name = models.CharField(max_length=200)
    region = models.CharField(
        max_length=20,
        choices=Region.choices,
        default=Region.MINDANAO,
    )
    latin_honor = models.CharField(
        max_length=30,
        choices=LatinHonor.choices,
        blank=True,
        default="",
    )
    message = models.TextField()
    image = models.ImageField(upload_to="scholars/")
    thumbnail = models.ImageField(upload_to="scholars/thumbs/", blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    @property
    def full_name(self):
        parts = [self.first_name]
        if self.middle_initial:
            parts.append(self.middle_initial)
        parts.append(self.last_name)
        if self.suffix:
            parts.append(self.suffix)
        return " ".join(parts)

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        if self.pk is None:
            max_order = Scholar.objects.aggregate(Max("order"))["order__max"]
            self.order = (max_order or 0) + 1
        super().save(*args, **kwargs)
        if self.image:
            try:
                self._generate_thumbnail()
            except Exception:
                logger.exception("Failed to generate scholar thumbnail.")

    def _generate_thumbnail(self):
        with self.image.open("rb") as image_file:
            img = Image.open(image_file)
            img.load()
        img.thumbnail((100, 120))
        buffer = BytesIO()
        img_format = img.format if img.format in ("JPEG", "PNG", "WEBP") else "JPEG"
        if img_format == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(buffer, format=img_format)
        filename = f"thumb_{self.image.name.split('/')[-1]}"
        self.thumbnail.save(filename, ContentFile(buffer.getvalue()), save=False)
        super().save(update_fields=["thumbnail"])


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=UserRole.choices)
    region = models.CharField(max_length=20, choices=Region.choices, blank=True, default="")

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"
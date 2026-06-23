from django.db import migrations, models
import django.db.models.deletion


def backfill_school_and_degree_refs(apps, schema_editor):
    Scholar = apps.get_model("testimonials", "Scholar")
    School = apps.get_model("testimonials", "School")
    Degree = apps.get_model("testimonials", "Degree")

    def get_or_create_case_insensitive(model, *, region, name):
        cleaned = name.strip()
        existing = model.objects.filter(region=region, name__iexact=cleaned).first()
        if existing:
            return existing
        return model.objects.create(region=region, name=cleaned)

    for scholar in Scholar.objects.all().iterator():
        update_fields = []

        if scholar.school:
            school = get_or_create_case_insensitive(
                School,
                region=scholar.region,
                name=scholar.school,
            )
            scholar.school_ref_id = school.id
            update_fields.append("school_ref")

        if scholar.degree_name:
            degree = get_or_create_case_insensitive(
                Degree,
                region=scholar.region,
                name=scholar.degree_name,
            )
            scholar.degree_ref_id = degree.id
            update_fields.append("degree_ref")

        if update_fields:
            scholar.save(update_fields=update_fields)


class Migration(migrations.Migration):
    dependencies = [
        ("testimonials", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Degree",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=200)),
                (
                    "region",
                    models.CharField(
                        choices=[
                            ("luzon", "Luzon"),
                            ("visayas", "Visayas"),
                            ("mindanao", "Mindanao"),
                        ],
                        default="mindanao",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="School",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=200)),
                (
                    "region",
                    models.CharField(
                        choices=[
                            ("luzon", "Luzon"),
                            ("visayas", "Visayas"),
                            ("mindanao", "Mindanao"),
                        ],
                        default="mindanao",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddField(
            model_name="scholar",
            name="degree_ref",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="scholars",
                to="testimonials.degree",
            ),
        ),
        migrations.AddField(
            model_name="scholar",
            name="school_ref",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="scholars",
                to="testimonials.school",
            ),
        ),
        migrations.AddField(
            model_name="scholar",
            name="year_graduated",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddConstraint(
            model_name="degree",
            constraint=models.UniqueConstraint(
                fields=("region", "name"), name="unique_degree_name_per_region"
            ),
        ),
        migrations.AddConstraint(
            model_name="school",
            constraint=models.UniqueConstraint(
                fields=("region", "name"), name="unique_school_name_per_region"
            ),
        ),
        migrations.RunPython(
            backfill_school_and_degree_refs, migrations.RunPython.noop
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("testimonials", "0002_school_degree_year_refs"),
    ]

    operations = [
        migrations.AlterField(
            model_name="scholar",
            name="latin_honor",
            field=models.CharField(
                blank=True,
                choices=[
                    ("", "None"),
                    ("cum_laude", "Cum Laude"),
                    ("magna_cum_laude", "Magna Cum Laude"),
                    ("summa_cum_laude", "Summa Cum Laude"),
                    ("cumbati", "CumBati"),
                    ("cumpyansa", "Cumpyansa"),
                ],
                default="",
                max_length=30,
            ),
        ),
    ]

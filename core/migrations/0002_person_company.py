# Generated by Django 4.2.11 on 2024-04-29 17:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="person",
            name="company",
            field=models.CharField(blank=True, max_length=100),
        ),
    ]

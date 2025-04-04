# Generated by Django 5.1.2 on 2025-03-30 19:00

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_alter_profile_options_profile_avatar_profile_bio_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='user',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to='core.customuser', verbose_name='user'),
        ),
    ]

# Generated by Django 4.2 on 2024-04-27 13:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('messenger', '0008_room_rules'),
    ]

    operations = [
        migrations.AddField(
            model_name='media',
            name='message_id',
            field=models.IntegerField(null=True),
        ),
    ]

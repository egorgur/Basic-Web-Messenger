# Generated by Django 4.2 on 2024-03-03 11:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('messenger', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='name',
            field=models.CharField(default='none', max_length=100),
        ),
    ]

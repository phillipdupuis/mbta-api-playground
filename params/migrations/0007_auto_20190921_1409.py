# Generated by Django 2.2.5 on 2019-09-21 18:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('params', '0006_auto_20190921_1358'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mbtaattribute',
            name='description',
            field=models.TextField(blank=True),
        ),
    ]

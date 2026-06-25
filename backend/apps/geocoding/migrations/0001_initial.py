from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='GeocodedLocation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('query', models.CharField(db_index=True, max_length=255, unique=True)),
                ('latitude', models.FloatField()),
                ('longitude', models.FloatField()),
                ('source', models.CharField(default='nominatim', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'db_table': 'geocoded_location'},
        ),
    ]

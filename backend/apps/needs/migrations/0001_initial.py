import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Claims the existing ai_need table for the needs app.
    SeparateDatabaseAndState: Django state gets the Need model,
    but no SQL runs because the table already exists.
    """

    initial = True

    dependencies = [
        ('ai', '0002_remove_need_pincode'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='Need',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('name', models.CharField(max_length=100)),
                        ('problem', models.TextField()),
                        ('need_type', models.CharField(
                            choices=[
                                ('food', 'Food'), ('medical', 'Medical'), ('water', 'Water'),
                                ('shelter', 'Shelter'), ('electricity', 'Electricity'), ('general', 'General'),
                            ],
                            max_length=50,
                        )),
                        ('location_text', models.CharField(blank=True, max_length=200, null=True)),
                        ('latitude', models.FloatField(blank=True, null=True)),
                        ('longitude', models.FloatField(blank=True, null=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('ngo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.user')),
                    ],
                    options={'db_table': 'ai_need'},
                ),
            ],
            database_operations=[],
        ),
    ]

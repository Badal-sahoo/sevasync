from django.db import migrations


class Migration(migrations.Migration):
    """
    Removes Need from the ai app's Django state now that needs app owns it.
    SeparateDatabaseAndState: state removes the model,
    but no SQL runs so the ai_need table is not dropped.
    """

    dependencies = [
        ('ai', '0002_remove_need_pincode'),
        ('needs', '0001_initial'),
        # Must run AFTER tasks stops referencing ai.need (tasks.0002 removes the
        # Task.need FK). Otherwise a fresh-DB build deletes ai.Need from project
        # state before tasks.0001 creates its FK to it -> "ai.need cannot be resolved".
        ('tasks', '0002_remove_task_need_remove_task_title_task_need_type_and_more'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name='Need'),
            ],
            database_operations=[],
        ),
    ]

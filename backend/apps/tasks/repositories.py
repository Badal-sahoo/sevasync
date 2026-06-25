from .models import Task, Assignment, ProgressUpdate


class TaskRepository:
    @staticmethod
    def get_by_id(task_id):
        return Task.objects.get(id=task_id)

    @staticmethod
    def get_pending_by_ngo(ngo):
        return Task.objects.filter(ngo=ngo, status='pending')

    @staticmethod
    def bulk_create(tasks):
        return Task.objects.bulk_create(tasks)

    @staticmethod
    def bulk_update(tasks, fields):
        return Task.objects.bulk_update(tasks, fields)


class AssignmentRepository:
    @staticmethod
    def exists(task, volunteer):
        return Assignment.objects.filter(task=task, volunteer=volunteer).exists()

    @staticmethod
    def has_active(volunteer, exclude_id=None):
        qs = Assignment.objects.filter(volunteer=volunteer, status="accepted")
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        return qs.exists()

    @staticmethod
    def create(task, volunteer, status="requested"):
        return Assignment.objects.create(task=task, volunteer=volunteer, status=status)

    @staticmethod
    def get_for_task_and_volunteer(task_id, volunteer):
        return Assignment.objects.filter(task_id=task_id, volunteer=volunteer).first()

    @staticmethod
    def get_accepted_for_task(task):
        return Assignment.objects.filter(
            task=task, status="accepted"
        ).select_related("volunteer")

    @staticmethod
    def reject_others(volunteer, exclude_id):
        Assignment.objects.filter(volunteer=volunteer).exclude(id=exclude_id).update(status="rejected")


class ProgressUpdateRepository:
    @staticmethod
    def create(task_id, volunteer, message):
        return ProgressUpdate.objects.create(task_id=task_id, volunteer=volunteer, message=message)

    @staticmethod
    def get_for_task(task_id, limit=50):
        return (
            ProgressUpdate.objects
            .filter(task_id=task_id)
            .select_related("volunteer__user")
            .order_by("-created_at")[:limit]
        )

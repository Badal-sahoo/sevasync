from .models import Need


class NeedRepository:
    @staticmethod
    def bulk_create(needs):
        return Need.objects.bulk_create(needs)

    @staticmethod
    def get_by_ngo(ngo_id):
        return Need.objects.filter(ngo_id=ngo_id)

    @staticmethod
    def get_geocoded_by_ngo(ngo_id):
        return Need.objects.filter(ngo_id=ngo_id) \
            .exclude(latitude=None).exclude(longitude=None)

    @staticmethod
    def count_by_ngo(ngo):
        return Need.objects.filter(ngo=ngo).count()

"""
End-to-end audit test harness — simulates NGO / Volunteer users across every
workflow. Firebase auth and geocoding are mocked so the real business logic,
serializers, DB relationships, and API contracts are all exercised.

Run:  ./venv/bin/python manage.py test audit_tests --verbosity=2
"""
from unittest import mock

from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User
from apps.volunteers.models import Volunteer
from apps.needs.models import Need
from apps.tasks.models import Task, Assignment, ProgressUpdate


def fake_verify(token):
    """Token == email. Empty/None → invalid."""
    if not token:
        return None
    return {"email": token}


def fake_geocode(pincode=None, location=None):
    # Deterministic coords clustered around a base point so DBSCAN groups them.
    return (12.9716, 77.5946)


AUTH_PATCHES = [
    "infrastructure.firebase.authentication.verify_firebase_token",
    "apps.users.views.verify_firebase_token",
]


class Base(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Patch every Firebase verify entrypoint
        self._patchers = [mock.patch(t, side_effect=fake_verify) for t in AUTH_PATCHES]
        for p in self._patchers:
            p.start()
            self.addCleanup(p.stop)
        # Patch geocoding everywhere it is imported
        for t in ("apps.needs.services.geocode_location", "apps.needs.views.geocode_location"):
            gp = mock.patch(t, side_effect=fake_geocode)
            gp.start()
            self.addCleanup(gp.stop)

    def auth(self, email):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {email}")

    def signup(self, email, name, role):
        return self.client.post("/api/auth/signup/", {"token": email, "name": name, "role": role}, format="json")

    def make_ngo(self, email="ngo@x.com", name="NGO One"):
        self.signup(email, name, "NGO")
        return User.objects.get(email=email)

    def make_vol(self, email, name, lat=12.9716, lon=77.5946, skills=None, points=0):
        self.signup(email, name, "VOLUNTEER")
        u = User.objects.get(email=email)
        v = Volunteer.objects.get(user=u)
        v.latitude, v.longitude = lat, lon
        v.skills = skills if skills is not None else ["food", "medical"]
        v.total_points = points
        v.save()
        return v


class AuthTests(Base):
    def test_signup_creates_user_and_volunteer(self):
        r = self.signup("v@x.com", "Vol", "VOLUNTEER")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertTrue(Volunteer.objects.filter(user__email="v@x.com").exists())

    def test_signup_ngo_no_volunteer(self):
        r = self.signup("n@x.com", "Ngo", "NGO")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertFalse(Volunteer.objects.filter(user__email="n@x.com").exists())

    def test_signup_duplicate_rejected(self):
        self.signup("dup@x.com", "A", "NGO")
        r = self.signup("dup@x.com", "B", "NGO")
        self.assertEqual(r.status_code, 400)

    def test_signup_invalid_role(self):
        r = self.signup("z@x.com", "Z", "SUPERHERO")
        self.assertEqual(r.status_code, 400)

    def test_login_ok(self):
        self.make_ngo("ngo@x.com")
        r = self.client.post("/api/auth/login/", {"token": "ngo@x.com"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()["role"], "NGO")

    def test_login_unknown_user(self):
        r = self.client.post("/api/auth/login/", {"token": "ghost@x.com"}, format="json")
        self.assertEqual(r.status_code, 404)

    def test_protected_endpoint_requires_auth(self):
        # No credentials -> 401 Unauthorized (not 403)
        r = self.client.get("/api/ngo/dashboard/")
        self.assertEqual(r.status_code, 401, r.content)

    def test_invalid_token_is_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer")  # malformed
        r = self.client.get("/api/ngo/dashboard/")
        self.assertEqual(r.status_code, 401, r.content)


class RolePermissionTests(Base):
    def test_volunteer_cannot_access_ngo_dashboard(self):
        self.make_vol("v@x.com", "Vol")
        self.auth("v@x.com")
        r = self.client.get("/api/ngo/dashboard/")
        self.assertEqual(r.status_code, 403, r.content)

    def test_ngo_cannot_access_volunteer_dashboard(self):
        self.make_ngo("ngo@x.com")
        self.auth("ngo@x.com")
        r = self.client.get("/api/volunteers/dashboard/")
        self.assertEqual(r.status_code, 403, r.content)


class NgoDashboardTests(Base):
    def test_dashboard_counts(self):
        ngo = self.make_ngo()
        Need.objects.create(ngo=ngo, name="n", problem="p", need_type="food", latitude=1, longitude=1)
        Task.objects.create(ngo=ngo, need_type="food", urgency="HIGH", people_count=3, status="pending")
        self.auth("ngo@x.com")
        r = self.client.get("/api/ngo/dashboard/")
        self.assertEqual(r.status_code, 200, r.content)
        d = r.json()
        self.assertEqual(d["total_requests"], 1)
        self.assertEqual(d["total_tasks"], 1)
        self.assertEqual(d["urgent_tasks"], 1)

    def test_dashboard_counts_drop_after_completion(self):
        ngo = self.make_ngo()
        task = Task.objects.create(ngo=ngo, need_type="food", urgency="HIGH", people_count=3,
                                   status="pending", latitude=12.9716, longitude=77.5946)
        vol = self.make_vol("v1@x.com", "Vol", lat=12.972, lon=77.595)
        self.auth("ngo@x.com")
        before = self.client.get("/api/ngo/dashboard/").json()
        self.assertEqual(before["total_tasks"], 1)
        self.assertEqual(before["urgent_tasks"], 1)
        self.assertEqual(before["completed_tasks"], 0)
        # assign -> accept -> complete
        self.client.post(f"/api/tasks/{task.id}/assign/", {"volunteer_id": vol.id}, format="json")
        self.auth("v1@x.com")
        self.client.post(f"/api/tasks/{task.id}/respond/", {"action": "accept"}, format="json")
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{task.id}/complete/", {}, format="json")
        after = self.client.get("/api/ngo/dashboard/").json()
        self.assertEqual(after["total_tasks"], 0, "active total must drop after completion")
        self.assertEqual(after["urgent_tasks"], 0, "urgent must drop after completion")
        self.assertEqual(after["completed_tasks"], 1)

    def test_requests_list_and_filter(self):
        ngo = self.make_ngo()
        Task.objects.create(ngo=ngo, need_type="food", urgency="HIGH", people_count=3, status="pending")
        Task.objects.create(ngo=ngo, need_type="water", urgency="LOW", people_count=1, status="pending")
        self.auth("ngo@x.com")
        r = self.client.get("/api/ngo/requests/")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(len(r.json()), 2)
        r2 = self.client.get("/api/ngo/requests/?urgency=HIGH")
        self.assertEqual(len(r2.json()), 1)
        r3 = self.client.get("/api/ngo/requests/?urgency=BOGUS")
        self.assertEqual(r3.status_code, 400)

    def test_heatmap(self):
        ngo = self.make_ngo()
        Need.objects.create(ngo=ngo, name="n", problem="p", need_type="medical", latitude=12.9, longitude=77.5)
        self.auth("ngo@x.com")
        r = self.client.get("/api/ngo/heatmap/")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(len(r.json()), 1)
        self.assertIn("intensity", r.json()[0])


class CsvUploadPipelineTests(Base):
    def _csv(self, rows):
        header = "name,problem,pincode,location,need_type\n"
        body = "\n".join(
            f"{r['name']},{r['problem']},{r.get('pincode','')},{r.get('location','')},{r['need_type']}"
            for r in rows
        )
        from django.core.files.uploadedfile import SimpleUploadedFile
        return SimpleUploadedFile("needs.csv", (header + body).encode(), content_type="text/csv")

    def test_upload_creates_needs_and_tasks(self):
        self.make_ngo()
        self.auth("ngo@x.com")
        rows = [
            {"name": f"P{i}", "problem": "no food available", "location": "Bangalore", "need_type": "food"}
            for i in range(5)
        ]
        f = self._csv(rows)
        r = self.client.post("/api/ngo/upload/", {"file": f}, format="multipart")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()["created_count"], 5)
        self.assertEqual(Need.objects.count(), 5)
        # 5 clustered food needs -> at least one task generated
        self.assertGreaterEqual(Task.objects.filter(ngo__email="ngo@x.com").count(), 1)

    def test_upload_dedup(self):
        self.make_ngo()
        self.auth("ngo@x.com")
        rows = [{"name": "Same", "problem": "same problem", "location": "Bangalore", "need_type": "food"}]
        self.client.post("/api/ngo/upload/", {"file": self._csv(rows)}, format="multipart")
        r2 = self.client.post("/api/ngo/upload/", {"file": self._csv(rows)}, format="multipart")
        self.assertEqual(r2.json()["skipped_duplicates"], 1, r2.content)

    def test_upload_requires_file(self):
        self.make_ngo()
        self.auth("ngo@x.com")
        r = self.client.post("/api/ngo/upload/", {}, format="multipart")
        self.assertEqual(r.status_code, 400)

    def test_upload_without_need_type_column_is_classified(self):
        """A CSV that only has name/problem/pincode/location must still classify
        need types from the problem text (not dump everything into 'general')."""
        self.make_ngo()
        self.auth("ngo@x.com")
        header = "name,problem,pincode,location\n"
        body = "\n".join([
            "u1,water shortage,560001,Bangalore",
            "u2,food shortage,560001,Bangalore",
            "u3,medical emergency,560001,Bangalore",
            "u4,need shelter,560001,Bangalore",
            "u5,power cut,560001,Bangalore",
        ])
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile("needs.csv", (header + body).encode(), content_type="text/csv")
        r = self.client.post("/api/ngo/upload/", {"file": f}, format="multipart")
        self.assertEqual(r.status_code, 200, r.content)
        types = set(Need.objects.filter(ngo__email="ngo@x.com").values_list("need_type", flat=True))
        self.assertEqual(types, {"water", "food", "medical", "shelter", "electricity"}, types)

    def test_create_need_manual(self):
        self.make_ngo()
        self.auth("ngo@x.com")
        r = self.client.post("/api/needs/", {"name": "A", "problem": "needs water", "need_type": "water", "location": "Bangalore"}, format="json")
        self.assertEqual(r.status_code, 201, r.content)


class MatchingTests(Base):
    def test_get_matched_volunteers(self):
        from apps.matching.utils import get_matched_volunteers
        ngo = self.make_ngo()
        task = Task.objects.create(ngo=ngo, need_type="food", urgency="HIGH", people_count=3,
                                   status="pending", latitude=12.9716, longitude=77.5946)
        self.make_vol("v1@x.com", "Near Vol", lat=12.9720, lon=77.5950, skills=["food"])
        self.make_vol("v2@x.com", "Far Vol", lat=40.0, lon=-70.0, skills=["food"])
        results = get_matched_volunteers(task)
        names = [r["name"] for r in results]
        self.assertIn("Near Vol", names)
        self.assertNotIn("Far Vol", names)  # >10km away excluded

    def test_progress_endpoint_returns_recommendations(self):
        ngo = self.make_ngo()
        task = Task.objects.create(ngo=ngo, need_type="food", urgency="HIGH", people_count=3,
                                   status="pending", latitude=12.9716, longitude=77.5946)
        self.make_vol("v1@x.com", "Near Vol", lat=12.9720, lon=77.5950, skills=["food"])
        self.auth("ngo@x.com")
        r = self.client.get(f"/api/tasks/{task.id}/progress/")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertIsNone(r.json()["match_warning"], r.json())
        self.assertGreaterEqual(len(r.json()["recommended_volunteers"]), 1)


class AssignmentWorkflowTests(Base):
    def _setup(self):
        self.ngo = self.make_ngo()
        self.task = Task.objects.create(ngo=self.ngo, need_type="food", urgency="HIGH",
                                        people_count=3, status="pending",
                                        latitude=12.9716, longitude=77.5946)
        self.vol = self.make_vol("v1@x.com", "Vol One", lat=12.972, lon=77.595, skills=["food"])

    def test_full_assign_accept_progress_complete(self):
        self._setup()
        # NGO assigns
        self.auth("ngo@x.com")
        r = self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, "requested")
        # Volunteer accepts
        self.auth("v1@x.com")
        r = self.client.post(f"/api/tasks/{self.task.id}/respond/", {"action": "accept"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, "assigned")
        # Volunteer posts progress
        r = self.client.post(f"/api/tasks/{self.task.id}/progress/", {"message": "On my way"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(ProgressUpdate.objects.filter(task=self.task).count(), 1)
        # NGO completes -> reward
        self.auth("ngo@x.com")
        r = self.client.post(f"/api/tasks/{self.task.id}/complete/", {}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()["volunteers_rewarded"], 1)
        self.vol.refresh_from_db()
        self.assertEqual(self.vol.total_points, 50)  # HIGH urgency
        self.assertEqual(self.vol.tasks_completed, 1)

    def test_reject(self):
        self._setup()
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        self.auth("v1@x.com")
        r = self.client.post(f"/api/tasks/{self.task.id}/respond/", {"action": "reject"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        a = Assignment.objects.get(task=self.task, volunteer=self.vol)
        self.assertEqual(a.status, "rejected")
        # Task must return to the pool, not get stuck in "requested"
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, "pending")

    def test_double_assign_same_volunteer_rejected(self):
        self._setup()
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        r = self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        self.assertEqual(r.status_code, 400, r.content)

    def test_complete_without_volunteer_rejected(self):
        self._setup()
        self.auth("ngo@x.com")
        r = self.client.post(f"/api/tasks/{self.task.id}/complete/", {}, format="json")
        self.assertEqual(r.status_code, 400, r.content)

    def test_complete_other_ngo_forbidden(self):
        self._setup()
        # assign + accept first
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        self.auth("v1@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/respond/", {"action": "accept"}, format="json")
        # other NGO tries to complete
        self.make_ngo("ngo2@x.com", "NGO Two")
        self.auth("ngo2@x.com")
        r = self.client.post(f"/api/tasks/{self.task.id}/complete/", {}, format="json")
        self.assertIn(r.status_code, (403, 404), r.content)

    def test_withdraw(self):
        self._setup()
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        a = Assignment.objects.get(task=self.task, volunteer=self.vol)
        self.auth("v1@x.com")
        r = self.client.post(f"/api/tasks/assignments/{a.id}/withdraw/", {}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        a.refresh_from_db()
        self.task.refresh_from_db()
        self.assertEqual(a.status, "withdrawn")
        self.assertEqual(self.task.status, "pending")

    def test_cancel_task(self):
        self._setup()
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        r = self.client.post(f"/api/tasks/{self.task.id}/cancel/", {}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, "cancelled")

    def test_multiple_volunteers_one_task_no_status_downgrade(self):
        self._setup()
        vol2 = self.make_vol("v2@x.com", "Vol Two", lat=12.972, lon=77.595, skills=["food"])
        self.auth("ngo@x.com")
        # request vol1, vol1 accepts -> task assigned
        self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        self.auth("v1@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/respond/", {"action": "accept"}, format="json")
        self.task.refresh_from_db(); self.assertEqual(self.task.status, "assigned")
        # NGO requests a SECOND volunteer for the same task -> must NOT downgrade to requested
        self.auth("ngo@x.com")
        r = self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": vol2.id}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, "assigned", "adding a volunteer must not downgrade an assigned task")

    def test_cannot_assign_to_completed_task(self):
        self._setup()
        vol2 = self.make_vol("v2@x.com", "Vol Two", lat=12.972, lon=77.595)
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        self.auth("v1@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/respond/", {"action": "accept"}, format="json")
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/complete/", {}, format="json")
        # now assign a fresh volunteer to the completed task -> blocked
        r = self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": vol2.id}, format="json")
        self.assertEqual(r.status_code, 400, r.content)

    def test_dashboard_active_volunteers_counts_accepted_only(self):
        self._setup()
        vol2 = self.make_vol("v2@x.com", "Vol Two", lat=12.972, lon=77.595)
        self.auth("ngo@x.com")
        # vol1 requested+accepted, vol2 only requested (then rejects)
        self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": vol2.id}, format="json")
        self.auth("v1@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/respond/", {"action": "accept"}, format="json")
        self.auth("v2@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/respond/", {"action": "reject"}, format="json")
        self.auth("ngo@x.com")
        d = self.client.get("/api/ngo/dashboard/").json()
        self.assertEqual(d["active_volunteers"], 1, d)  # only the accepted volunteer

    def test_volunteer_cannot_post_progress_after_completion(self):
        self._setup()
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        self.auth("v1@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/respond/", {"action": "accept"}, format="json")
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/complete/", {}, format="json")
        # volunteer tries to post an update on the finished task -> 403
        self.auth("v1@x.com")
        r = self.client.post(f"/api/tasks/{self.task.id}/progress/", {"message": "late update"}, format="json")
        self.assertEqual(r.status_code, 403, r.content)

    def test_volunteer_already_busy_cannot_be_assigned(self):
        self._setup()
        # vol accepts task 1
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        self.auth("v1@x.com")
        self.client.post(f"/api/tasks/{self.task.id}/respond/", {"action": "accept"}, format="json")
        # second task, try to assign same busy volunteer
        task2 = Task.objects.create(ngo=self.ngo, need_type="water", urgency="LOW", people_count=1,
                                    status="pending", latitude=12.9716, longitude=77.5946)
        self.auth("ngo@x.com")
        r = self.client.post(f"/api/tasks/{task2.id}/assign/", {"volunteer_id": self.vol.id}, format="json")
        self.assertEqual(r.status_code, 400, r.content)


class VolunteerSelfServiceTests(Base):
    def test_dashboard_profile_points(self):
        self.make_vol("v@x.com", "Vol", points=30)
        self.auth("v@x.com")
        self.assertEqual(self.client.get("/api/volunteers/dashboard/").status_code, 200)
        self.assertEqual(self.client.get("/api/volunteers/profile/").status_code, 200)
        p = self.client.get("/api/volunteers/points/")
        self.assertEqual(p.status_code, 200)
        self.assertEqual(p.json()["total_points"], 30)

    def test_update_profile_with_coords(self):
        self.make_vol("v@x.com", "Vol")
        self.auth("v@x.com")
        r = self.client.patch("/api/volunteers/me/",
                              {"skills": ["water"], "location": "Delhi", "latitude": 28.6, "longitude": 77.2},
                              format="json")
        self.assertEqual(r.status_code, 200, r.content)
        v = Volunteer.objects.get(user__email="v@x.com")
        self.assertEqual(v.latitude, 28.6)
        self.assertEqual(v.skills, ["water"])

    def test_update_availability(self):
        self.make_vol("v@x.com", "Vol")
        self.auth("v@x.com")
        r = self.client.patch("/api/volunteers/availability/", {"availability": False}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertFalse(Volunteer.objects.get(user__email="v@x.com").availability)

    def test_cannot_self_inflate_points(self):
        """Reward exploit guard: volunteer must not be able to set total_points/tasks_completed."""
        self.make_vol("v@x.com", "Vol", points=10)
        self.auth("v@x.com")
        r = self.client.patch("/api/volunteers/me/",
                              {"skills": ["food"], "location": "X",
                               "latitude": 12.9, "longitude": 77.5,
                               "total_points": 999999, "tasks_completed": 555},
                              format="json")
        self.assertEqual(r.status_code, 200, r.content)
        v = Volunteer.objects.get(user__email="v@x.com")
        self.assertEqual(v.total_points, 10, "total_points must not be mass-assignable")
        self.assertEqual(v.tasks_completed, 0, "tasks_completed must not be mass-assignable")


class NgoRequestsIntegrityTests(Base):
    def test_requests_does_not_show_rejected_volunteer(self):
        ngo = self.make_ngo()
        task = Task.objects.create(ngo=ngo, need_type="food", urgency="HIGH", people_count=3,
                                   status="pending", latitude=12.9716, longitude=77.5946)
        vol = self.make_vol("v1@x.com", "Vol One", lat=12.972, lon=77.595)
        # request then reject -> task back to pending, assignment rejected
        self.auth("ngo@x.com")
        self.client.post(f"/api/tasks/{task.id}/assign/", {"volunteer_id": vol.id}, format="json")
        self.auth("v1@x.com")
        self.client.post(f"/api/tasks/{task.id}/respond/", {"action": "reject"}, format="json")
        # NGO requests listing should not surface the rejected volunteer as assigned
        self.auth("ngo@x.com")
        r = self.client.get("/api/ngo/requests/")
        row = next(t for t in r.json() if t["id"] == task.id)
        self.assertIsNone(row["assigned_volunteer"], row)

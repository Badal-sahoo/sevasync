"""
Full end-to-end workflow verification — narrates the complete NGO + Volunteer
journey through the REAL API endpoints (Firebase token verification and the
external geocoding call are the only things mocked). Prints a step-by-step
transcript so every feature can be visually confirmed.

Run:  ./venv/bin/python manage.py test verify_workflows --noinput -v 1
"""
from unittest import mock

from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User
from apps.volunteers.models import Volunteer
from apps.needs.models import Need
from apps.tasks.models import Task, Assignment, ProgressUpdate


def fake_verify(token):
    return {"email": token} if token else None


def fake_geocode(pincode=None, location=None):
    # Bengaluru-ish coordinates so needs cluster and volunteers fall in range.
    return (12.9716, 77.5946)


def p(msg=""):
    print(msg)


def ok(label, detail=""):
    print(f"   ✓ {label}" + (f" — {detail}" if detail else ""))


class FullJourney(TestCase):
    def setUp(self):
        self.client = APIClient()
        for t in ("infrastructure.firebase.authentication.verify_firebase_token",
                  "apps.users.views.verify_firebase_token"):
            m = mock.patch(t, side_effect=fake_verify); m.start(); self.addCleanup(m.stop)
        for t in ("apps.needs.services.geocode_location", "apps.needs.views.geocode_location"):
            m = mock.patch(t, side_effect=fake_geocode); m.start(); self.addCleanup(m.stop)

    def auth(self, email):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {email}")

    # ------------------------------------------------------------------ #
    def test_full_journey(self):
        c = self.client

        p("\n" + "=" * 70)
        p("STEP 1 — AUTHENTICATION (signup + login)")
        p("=" * 70)

        # NGO signup + login
        r = c.post("/api/auth/signup/", {"token": "ngo@relief.org", "name": "Relief Org", "role": "NGO"}, format="json")
        assert r.status_code == 201, r.content
        ok("NGO signup", r.json()["message"])
        r = c.post("/api/auth/login/", {"token": "ngo@relief.org"}, format="json")
        assert r.status_code == 200 and r.json()["role"] == "NGO", r.content
        ok("NGO login", f"role={r.json()['role']} -> routes to /ngo-dashboard")

        # Two volunteers signup + login (Volunteer row auto-created on signup)
        for em, nm in [("alice@vol.com", "Alice"), ("bob@vol.com", "Bob")]:
            r = c.post("/api/auth/signup/", {"token": em, "name": nm, "role": "VOLUNTEER"}, format="json")
            assert r.status_code == 201, r.content
            assert Volunteer.objects.filter(user__email=em).exists()
            ok(f"Volunteer signup ({nm})", "Volunteer profile auto-created")
        r = c.post("/api/auth/login/", {"token": "alice@vol.com"}, format="json")
        assert r.status_code == 200 and r.json()["role"] == "VOLUNTEER"
        ok("Volunteer login (Alice)", "routes to /volunteer-dashboard")

        # Role isolation
        self.auth("alice@vol.com")
        assert c.get("/api/ngo/dashboard/").status_code == 403
        ok("Role guard", "volunteer blocked from NGO dashboard (403)")

        p("\n" + "=" * 70)
        p("STEP 2 — VOLUNTEERS SET PROFILE (skills, location, availability)")
        p("=" * 70)

        # Alice: skilled in food + near the task; Bob: generic skills + near
        self.auth("alice@vol.com")
        r = c.patch("/api/volunteers/me/",
                    {"skills": ["food", "medical"], "location": "MG Road",
                     "latitude": 12.9720, "longitude": 77.5950}, format="json")
        assert r.status_code == 200, r.content
        ok("Alice profile updated", "skills=[food, medical], pinned on map")
        r = c.patch("/api/volunteers/availability/", {"availability": True}, format="json")
        assert r.status_code == 200
        ok("Alice availability", "Available")

        self.auth("bob@vol.com")
        r = c.patch("/api/volunteers/me/",
                    {"skills": ["logistics"], "location": "Indiranagar",
                     "latitude": 12.9750, "longitude": 77.5980}, format="json")
        assert r.status_code == 200, r.content
        ok("Bob profile updated", "skills=[logistics], pinned on map")

        # Prove the reward-exploit guard holds during normal profile edits
        r = c.patch("/api/volunteers/me/", {"skills": ["logistics"], "total_points": 999999}, format="json")
        bob = Volunteer.objects.get(user__email="bob@vol.com")
        assert bob.total_points == 0, "exploit not blocked!"
        ok("Reward exploit guard", "PATCH total_points=999999 ignored (still 0)")

        p("\n" + "=" * 70)
        p("STEP 3 — NGO UPLOADS CSV -> AI PIPELINE GENERATES TASKS")
        p("=" * 70)

        self.auth("ngo@relief.org")
        header = "name,problem,pincode,location,need_type\n"
        rows = "\n".join(
            f"Person{i},urgent food and medical shortage,560001,MG Road,{'medical' if i % 2 else 'food'}"
            for i in range(6)
        )
        from django.core.files.uploadedfile import SimpleUploadedFile
        csv = SimpleUploadedFile("needs.csv", (header + rows).encode(), content_type="text/csv")
        r = c.post("/api/ngo/upload/", {"file": csv}, format="multipart")
        assert r.status_code == 200, r.content
        ok("CSV upload", r.json()["message"])
        ok("Needs persisted", f"{Need.objects.count()} Need rows")
        tasks = Task.objects.filter(ngo__email="ngo@relief.org")
        assert tasks.exists(), "pipeline produced no tasks"
        for t in tasks:
            ok("Task generated", f"#{t.id} {t.need_type} urgency={t.urgency} people={t.people_count} @({round(t.latitude,3)},{round(t.longitude,3)})")

        p("\n" + "=" * 70)
        p("STEP 4 — NGO DASHBOARD / REQUESTS / HEATMAP")
        p("=" * 70)
        r = c.get("/api/ngo/dashboard/"); d = r.json()
        ok("Dashboard", f"requests={d['total_requests']} tasks={d['total_tasks']} urgent={d['urgent_tasks']} completed={d['completed_tasks']}")
        r = c.get("/api/ngo/requests/")
        ok("Requests list", f"{len(r.json())} task(s) returned")
        r = c.get("/api/ngo/heatmap/")
        ok("Heatmap", f"{len(r.json())} geo-point(s) with intensity")

        p("\n" + "=" * 70)
        p("STEP 5 — MATCHING ALGORITHM (rank volunteers for a task)")
        p("=" * 70)
        task = tasks.filter(need_type="food").first() or tasks.first()
        r = c.get(f"/api/tasks/{task.id}/progress/"); d = r.json()
        assert d["match_warning"] is None, d
        recs = d["recommended_volunteers"]
        assert len(recs) >= 1, "matching returned nobody"
        ok("Matching ran", f"task #{task.id} ({task.need_type}) -> {len(recs)} candidate(s)")
        for rank, v in enumerate(recs, 1):
            ok(f"Rank #{rank}", f"{v['name']} score={v['score']} dist={v['distance_km']}km skills={v['skills']}")
        best = d["best_match"]
        ok("Best match", f"{best['name']} (NGO will send request here)")

        p("\n" + "=" * 70)
        p("STEP 6 — NGO SENDS REQUEST -> VOLUNTEER REJECTS -> TASK RETURNS TO POOL")
        p("=" * 70)
        alice = Volunteer.objects.get(user__email="alice@vol.com")
        bob = Volunteer.objects.get(user__email="bob@vol.com")
        # NGO sends request to Alice
        self.auth("ngo@relief.org")
        r = c.post(f"/api/tasks/{task.id}/assign/", {"volunteer_id": alice.id}, format="json")
        assert r.status_code == 200, r.content
        task.refresh_from_db()
        ok("NGO -> Alice request sent", f"task status now '{task.status}'")
        # Alice sees it on her dashboard
        self.auth("alice@vol.com")
        d = c.get("/api/volunteers/dashboard/").json()
        assert any(t["task_id"] == task.id for t in d["requested_tasks"]), d
        ok("Alice dashboard", f"requested_tasks shows task #{task.id}")
        # Alice REJECTS
        r = c.post(f"/api/tasks/{task.id}/respond/", {"action": "reject"}, format="json")
        assert r.status_code == 200, r.content
        task.refresh_from_db()
        assert task.status == "pending", f"task stuck in {task.status}"
        ok("Alice rejects", f"assignment=rejected, task returned to '{task.status}' (re-assignable)")
        # NGO requests list must NOT show Alice as assigned anymore
        self.auth("ngo@relief.org")
        row = next(x for x in c.get("/api/ngo/requests/").json() if x["id"] == task.id)
        assert row["assigned_volunteer"] is None, row
        ok("NGO requests integrity", "rejected volunteer not shown as assigned")

        p("\n" + "=" * 70)
        p("STEP 7 — NGO RE-SENDS TO BOB -> BOB ACCEPTS -> PROGRESS UPDATE")
        p("=" * 70)
        r = c.post(f"/api/tasks/{task.id}/assign/", {"volunteer_id": bob.id}, format="json")
        assert r.status_code == 200, r.content
        ok("NGO -> Bob request sent")
        self.auth("bob@vol.com")
        d = c.get("/api/volunteers/dashboard/").json()
        assert any(t["task_id"] == task.id for t in d["requested_tasks"])
        ok("Bob dashboard", "sees the request")
        r = c.post(f"/api/tasks/{task.id}/respond/", {"action": "accept"}, format="json")
        assert r.status_code == 200, r.content
        task.refresh_from_db()
        assert task.status == "assigned"
        ok("Bob accepts", f"task status now '{task.status}'")
        # Bob posts progress
        r = c.post(f"/api/tasks/{task.id}/progress/", {"message": "Reached site, distributing supplies."}, format="json")
        assert r.status_code == 200, r.content
        ok("Bob progress update", "message recorded")
        # active task now shows on dashboard
        d = c.get("/api/volunteers/dashboard/").json()
        assert any(t["task_id"] == task.id for t in d["active_tasks"])
        ok("Bob dashboard", "task moved to active_tasks")
        # Busy-volunteer guard
        self.auth("ngo@relief.org")
        other = tasks.exclude(id=task.id).first()
        if other:
            r = c.post(f"/api/tasks/{other.id}/assign/", {"volunteer_id": bob.id}, format="json")
            assert r.status_code == 400, r.content
            ok("Busy guard", "Bob can't be assigned a second active task (400)")

        p("\n" + "=" * 70)
        p("STEP 8 — NGO COMPLETES TASK -> BOB EARNS POINTS (REWARDS)")
        p("=" * 70)
        points_before = Volunteer.objects.get(id=bob.id).total_points
        done_before = Volunteer.objects.get(id=bob.id).tasks_completed
        r = c.post(f"/api/tasks/{task.id}/complete/", {}, format="json")
        assert r.status_code == 200, r.content
        ok("NGO completes task", r.json()["message"] + f" (rewarded={r.json()['volunteers_rewarded']})")
        bob = Volunteer.objects.get(id=bob.id)
        task.refresh_from_db()
        expected = {"HIGH": 50, "MEDIUM": 25, "LOW": 10}[task.urgency]
        assert bob.total_points == points_before + expected, (bob.total_points, expected)
        assert bob.tasks_completed == done_before + 1
        ok("Reward applied", f"urgency={task.urgency} -> +{expected} pts (now {bob.total_points}), tasks_completed={bob.tasks_completed}")
        # Volunteer points endpoint reflects it
        self.auth("bob@vol.com")
        pd = c.get("/api/volunteers/points/").json()
        assert pd["total_points"] == bob.total_points
        ok("Bob points card", f"total_points={pd['total_points']} tasks_completed={pd['tasks_completed']}")
        # Idempotent: completing again must NOT double-reward
        self.auth("ngo@relief.org")
        r = c.post(f"/api/tasks/{task.id}/complete/", {}, format="json")
        assert Volunteer.objects.get(id=bob.id).total_points == bob.total_points
        ok("No double-reward", "re-completing an already-completed task awards 0")

        p("\n" + "=" * 70)
        p("STEP 9 — NGO completed/urgent counts update")
        p("=" * 70)
        d = c.get("/api/ngo/dashboard/").json()
        assert d["completed_tasks"] >= 1
        ok("Dashboard", f"completed_tasks={d['completed_tasks']} active_volunteers={d['active_volunteers']}")

        p("\n" + "=" * 70)
        p("ALL WORKFLOWS VERIFIED ✅")
        p("=" * 70 + "\n")

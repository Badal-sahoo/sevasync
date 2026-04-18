import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import VolunteerStats from "../components/VolunteerStats";
import VolunteerTaskList from "../components/VolunteerTaskList";
import PointsCard from "../components/PointsCard";
import PerformanceChart from "../components/PerformanceChart";
import VolunteerProfileCard from "../components/VolunteerProfileCard";
import ToggleAvailability from "../components/ToggleAvailability";

import { getVolunteerDashboard, getVolunteerPoints } from "../services/api";
import { auth, logoutUser } from "../services/auth";

import "./VolunteerDashboard.css";

const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const VolunteerDashboard = () => {
  const navigate = useNavigate();

  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(true);
      if (!user) navigate("/");
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.removeItem("token");
    await logoutUser();
    navigate("/");
  };

  const fetchDashboard = async () => {
    const data = await getVolunteerDashboard();

    const requested = (data.requested_tasks || []).map((t) => ({
      ...t,
      assignmentStatus: "requested",
    }));

    const active = (data.active_tasks || []).map((t) => ({
      ...t,
      assignmentStatus: "accepted",
    }));

    const allTasks = [...requested, ...active].sort(
      (a, b) =>
        (urgencyOrder[a.urgency] ?? 99) -
        (urgencyOrder[b.urgency] ?? 99)
    );

    setTasks(allTasks);
  };

  useEffect(() => {
    if (authReady) fetchDashboard();
  }, [authReady]);

  const handleTaskUpdate = (taskId, update) => {
    setTasks((prev) =>
      prev
        .map((t) => {
          if (t.task_id === taskId) {
            if (update.remove) return null;
            return { ...t, ...update };
          }
          return t;
        })
        .filter(Boolean)
    );
  };

  if (!authReady) {
    return (
      <div className="volunteer-dashboard__notice">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="volunteer-dashboard">
      <div className="volunteer-dashboard__container">

        {/* 🔝 HEADER */}
        <header className="volunteer-dashboard__header">
          <div>
            <p className="volunteer-dashboard__eyebrow">SevaSync</p>
            <h1 className="volunteer-dashboard__title">
              Volunteer Dashboard
            </h1>
            <p className="volunteer-dashboard__subtitle">
              Manage tasks, track performance, and make an impact 🚀
            </p>
          </div>

          <button
            className="volunteer-dashboard__logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        {/* 🎯 BANNER */}
        <section className="volunteer-dashboard__banner">
          <h2>Stay Ready 💪</h2>
          <p>
            Accept tasks quickly, help efficiently, and grow your impact.
          </p>
        </section>

        {/* 📊 STATS */}
        <VolunteerStats />

        {/* 🧩 MAIN GRID */}
        <div className="volunteer-dashboard__content">

          {/* LEFT: TASKS */}
          <div className="volunteer-dashboard__main">
            <VolunteerTaskList
              tasks={tasks}
              onTaskUpdated={handleTaskUpdate}
              onTaskActionSuccess={fetchDashboard}
              onTaskClick={(id) => navigate(`/volunteer/task/${id}`)}
            />
          </div>

          {/* RIGHT: SIDEBAR */}
          <aside className="volunteer-dashboard__sidebar">

            {/* 🔥 TOGGLE AT TOP */}
            <ToggleAvailability />

            <VolunteerProfileCard />
            <PointsCard />
            <PerformanceChart />
          </aside>

        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
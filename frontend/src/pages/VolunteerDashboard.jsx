import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import VolunteerStats from '../components/VolunteerStats';
import VolunteerTaskList from '../components/VolunteerTaskList';
import PointsCard from '../components/PointsCard';
import PerformanceChart from '../components/PerformanceChart';
import VolunteerProfileCard from '../components/VolunteerProfileCard';
import { getVolunteerDashboard, getVolunteerPoints } from "../services/api";

import { auth, logoutUser } from '../services/auth';

import './VolunteerDashboard.css';
const urgencyOrder = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};
const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [points, setPoints] = useState(0);
  // 🔐 Wait for Firebase auth to be ready
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(true);

      if (!user) {
        navigate('/'); // redirect if not logged in
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 🚪 Logout
  const handleLogout = async () => {
    try {
      localStorage.removeItem("token"); // 🔥 important
      await logoutUser();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Failed to log out');
    }
  };
  const fetchDashboard = async () => {
    const data = await getVolunteerDashboard();

    const requested = (data.requested_tasks || []).map((t) => ({
      ...t,
      assignmentStatus: "requested",
      status: "requested",
    }));

    const active = (data.active_tasks || []).map((t) => ({
      ...t,
      assignmentStatus: "accepted",
      status: "assigned",
    }));
    const allTasks = [...requested, ...active].sort(
    (a, b) =>
      (urgencyOrder[a.urgency] ?? 99) -
      (urgencyOrder[b.urgency] ?? 99)
  );

     setTasks(allTasks);
  };

  const fetchPoints = async () => {
    const data = await getVolunteerPoints();
    setPoints(data.total_points || 0);
  };

  const fetchAllData = async () => {
    console.log("🔥 REFRESHING...");
    await fetchDashboard();
    await fetchPoints();
  };

  useEffect(() => {
    if (authReady) {
      fetchAllData();
    }
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
  // ⏳ Loading state
  if (!authReady) {
    return (
      <div className="volunteer-dashboard__notice">
        Loading volunteer session...
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
            <h1 className="volunteer-dashboard__title">Volunteer Dashboard</h1>
            <p className="volunteer-dashboard__subtitle">
              Track assignments, respond to requests, earn points, and measure your
              response performance from one place.
            </p>
          </div>

          <button
            className="volunteer-dashboard__logout"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        {/* 🎯 BANNER */}
        <section className="volunteer-dashboard__banner">
          <h2 className="volunteer-dashboard__banner-title">
            Ready for the next response
          </h2>
          <p className="volunteer-dashboard__banner-text">
            Review your current workload, manage task status, and keep an eye on your
            impact metrics throughout the field.
          </p>
        </section>

        {/* 📊 STATS */}
        <VolunteerStats />

        {/* 🧩 MAIN CONTENT */}
        <div className="volunteer-dashboard__content">

          {/* 📋 TASK LIST */}
          <div className="volunteer-dashboard__main">
            <VolunteerTaskList
              tasks={tasks}
              onTaskUpdated={handleTaskUpdate}
              onTaskActionSuccess={fetchAllData}
            />
          </div>

          {/* 📦 SIDEBAR */}
          <aside className="volunteer-dashboard__sidebar">
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
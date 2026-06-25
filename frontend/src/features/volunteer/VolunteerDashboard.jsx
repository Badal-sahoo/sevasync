import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import VolunteerSidebar from "../../shared/VolunteerSidebar";
import VolunteerStats from "./VolunteerStats";
import VolunteerTaskList from "./VolunteerTaskList";
import PointsCard from "./PointsCard";
import VolunteerProfileCard from "./VolunteerProfileCard";
import ToggleAvailability from "./ToggleAvailability";

import { getVolunteerDashboard } from "../../api/volunteers";
import { auth, logoutUser } from "../../auth/firebase";

const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const PAGES = {
  Overview: { title: "Dashboard Overview", sub: "Welcome back — here's your impact at a glance" },
  Tasks: { title: "My Tasks", sub: "Requests awaiting your response and active assignments" },
  Profile: { title: "My Profile", sub: "Keep your skills, location and availability up to date" },
  Rewards: { title: "Rewards", sub: "Points earned and your next milestone" },
};

const VolunteerDashboard = () => {
  const navigate = useNavigate();

  const [active, setActive] = useState("Overview");
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [dashError, setDashError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }
      const freshToken = await user.getIdToken(true);
      localStorage.setItem("token", freshToken);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.removeItem("token");
    try {
      await logoutUser();
    } finally {
      navigate("/");
    }
  };

  const fetchDashboard = async () => {
    try {
      setDashError("");
      const data = await getVolunteerDashboard();
      const requested = (data.requested_tasks || []).map((t) => ({ ...t, assignmentStatus: "requested" }));
      const activeT = (data.active_tasks || []).map((t) => ({ ...t, assignmentStatus: "accepted" }));
      const allTasks = [...requested, ...activeT].sort(
        (a, b) => (urgencyOrder[a.urgency] ?? 99) - (urgencyOrder[b.urgency] ?? 99)
      );
      setTasks(allTasks);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      setDashError("Could not load dashboard. Please refresh or log in again.");
    }
  };

  useEffect(() => {
    if (authReady) fetchDashboard();
  }, [authReady]);

  const handleTaskUpdate = (taskId, update) => {
    setTasks((prev) =>
      prev
        .map((t) => (t.task_id === taskId ? (update.remove ? null : { ...t, ...update }) : t))
        .filter(Boolean)
    );
  };

  const taskListEl = (
    <VolunteerTaskList
      tasks={tasks}
      onTaskUpdated={handleTaskUpdate}
      onTaskActionSuccess={fetchDashboard}
      onTaskClick={(id) => navigate(`/volunteer/task/${id}`)}
    />
  );

  const errorBox = dashError ? (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
      {dashError}
    </div>
  ) : null;

  const renderContent = () => {
    switch (active) {
      case "Overview":
        return (
          <div className="flex flex-col gap-7">
            <VolunteerStats />
            {errorBox}
            <div className="grid grid-cols-1 gap-7 xl:grid-cols-[2.2fr_1fr]">
              <div>{taskListEl}</div>
              <aside className="flex flex-col gap-5">
                <ToggleAvailability />
                <PointsCard />
              </aside>
            </div>
          </div>
        );
      case "Tasks":
        return (
          <div className="flex flex-col gap-5">
            {errorBox}
            {taskListEl}
          </div>
        );
      case "Profile":
        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ToggleAvailability />
            <VolunteerProfileCard />
          </div>
        );
      case "Rewards":
        return <div className="max-w-md"><PointsCard /></div>;
      default:
        return null;
    }
  };

  const page = PAGES[active] || { title: active, sub: "" };

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f5ff] text-[15px] font-semibold text-blue-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f0f5ff] font-poppins">
      <VolunteerSidebar active={active} setActive={setActive} />

      <div className="ml-[250px] flex flex-1 flex-col">
        {/* Top panel */}
        <div className="sticky top-0 z-[100] flex items-center justify-between border-b border-[#e2eaf5] bg-white px-8 py-[22px] shadow-[0_1px_10px_rgba(10,31,92,0.05)]">
          <div>
            <h1 className="m-0 text-xl font-bold text-[#0a1f5c]">{page.title}</h1>
            <p className="mt-0.5 text-[13px] text-[#8fa3c0]">{page.sub}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border-[1.5px] border-rose-500 px-[18px] py-2 text-[13px] font-semibold text-rose-500 transition hover:bg-rose-500 hover:text-white"
          >
            Sign Out
          </button>
        </div>

        <div className="flex-1 p-8">{renderContent()}</div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;

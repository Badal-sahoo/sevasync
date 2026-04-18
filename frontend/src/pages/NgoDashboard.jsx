import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";

import Sidebar from "../components/Sidebar";
import StatsCards from "../components/StatsCards";
import TaskList from "../components/TaskList";
import Heatmap from "../components/Heatmap";
import UploadCSV from "../components/UploadCSV";

const NgoDashboard = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState("Home");

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (error) {
      alert("Failed to log out");
    }
  };

  const pageTitles = {
    Home: { title: "Dashboard Overview", sub: "Welcome back — here's what's happening today" },
    Upload: { title: "Upload Data", sub: "Import CSV files to update tasks and requests" },
    TaskList: { title: "Pending Tasks", sub: "Tasks awaiting volunteer assignment" },
    Assigned: { title: "Assigned Tasks", sub: "Tasks currently being handled" },
    Completed: { title: "Completed Tasks", sub: "Successfully resolved tasks" },
  };

  const renderContent = () => {
    switch (active) {
      case "Home":
        return (
          <>
            <StatsCards ngoId={1} />
            <Heatmap />
          </>
        );
      case "TaskList":
        return <TaskList ngoId={1} filter="pending" />;
      case "Assigned":
        return <TaskList ngoId={1} filter="assigned" />;
      case "Completed":
        return <TaskList ngoId={1} filter="completed" />;
      case "Upload":
        return <UploadCSV ngoId={1} />;
      default:
        return null;
    }
  };

  const page = pageTitles[active] || { title: active, sub: "" };

  return (
    <div style={styles.wrapper}>
      <Sidebar active={active} setActive={setActive} />

      <div style={styles.main}>
        {/* TOP BAR */}
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.heading}>{page.title}</h1>
            <p style={styles.subheading}>{page.sub}</p>
          </div>

          <div style={styles.topRight}>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Sign Out
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={styles.content}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    background: "#f0f5ff",
    minHeight: "100vh",
  },

  main: {
    marginLeft: "250px",
    flex: 1,
    padding: "0",
    display: "flex",
    flexDirection: "column",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 32px",
    background: "#ffffff",
    borderBottom: "1px solid #e2eaf5",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 1px 10px rgba(10,31,92,0.05)",
  },

  heading: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0a1f5c",
    margin: 0,
  },

  subheading: {
    fontSize: "13px",
    color: "#8fa3c0",
    margin: "3px 0 0",
  },

  topRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  notifBtn: {
    width: "38px",
    height: "38px",
    background: "#f0f5ff",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "16px",
    border: "1px solid #dce6f5",
  },

  logoutBtn: {
    padding: "8px 18px",
    background: "transparent",
    border: "1.5px solid #ef4444",
    borderRadius: "8px",
    color: "#ef4444",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s",
  },

  content: {
    padding: "28px 32px",
    flex: 1,
  },
};

export default NgoDashboard;

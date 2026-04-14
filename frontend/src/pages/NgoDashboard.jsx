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

  return (
    <div>
      {/* Sidebar */}
      <Sidebar active={active} setActive={setActive} />

      {/* Main Content */}
      <div style={{ marginLeft: "240px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>{active}</h2>

          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        <div style={{ marginTop: "20px" }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default NgoDashboard;
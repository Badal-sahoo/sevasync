import React, { useEffect, useState } from "react";
import { getNgoDashboard } from "../services/ngoApi";

const StatsCards = ({ ngoId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getNgoDashboard(ngoId);
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [ngoId]);

  if (loading) return <p>Loading dashboard...</p>;
  if (!stats) return <p>No data available</p>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3>Total Requests</h3>
        <p>{stats.total_requests}</p>
      </div>

      <div style={styles.card}>
        <h3>Total Tasks</h3>
        <p>{stats.total_tasks}</p>
      </div>

      <div style={styles.card}>
        <h3>Completed Tasks</h3>
        <p>{stats.completed_tasks}</p>
      </div>

      <div style={styles.card}>
        <h3>Active Volunteers</h3>
        <p>{stats.active_volunteers}</p>
      </div>

      <div style={styles.card}>
        <h3>Urgent Tasks</h3>
        <p>{stats.urgent_tasks}</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  },
  card: {
    padding: "15px",
    borderRadius: "12px",
    background: "#1e293b",
    color: "white",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  },
};

export default StatsCards;
import React, { useEffect, useState } from "react";
import { getNgoDashboard } from "../services/api";

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

  if (loading)
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingBar} />
      </div>
    );

  if (!stats)
    return <p style={{ color: "#ef4444", fontSize: "14px" }}>No data available</p>;

  const cards = [
    {
      title: "Total Requests",
      value: stats.total_requests,
      icon: "📋",
      accent: "#2563eb",
      bg: "#eff6ff",
      border: "#bfdbfe",
    },
    {
      title: "Total Tasks",
      value: stats.total_tasks,
      icon: "📌",
      accent: "#7c3aed",
      bg: "#f5f3ff",
      border: "#ddd6fe",
    },
    {
      title: "Completed",
      value: stats.completed_tasks,
      icon: "✅",
      accent: "#059669",
      bg: "#f0fdf4",
      border: "#bbf7d0",
    },
    {
      title: "Active Volunteers",
      value: stats.active_volunteers,
      icon: "🙋",
      accent: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
    },
    {
      title: "Urgent Tasks",
      value: stats.urgent_tasks,
      icon: "🚨",
      accent: "#dc2626",
      bg: "#fff1f2",
      border: "#fecdd3",
    },
  ];

  return (
    <div style={styles.container}>
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            ...styles.card,
            background: card.bg,
            border: `1.5px solid ${card.border}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = `0 8px 24px ${card.accent}22`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
          }}
        >
          <div style={styles.cardTop}>
            <span style={{ ...styles.iconBox, background: `${card.accent}18`, color: card.accent }}>
              {card.icon}
            </span>
            <span style={{ ...styles.dot, background: card.accent }} />
          </div>
          <div style={{ ...styles.value, color: card.accent }}>{card.value}</div>
          <div style={styles.title}>{card.title}</div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  loadingWrap: {
    background: "#f0f5ff",
    borderRadius: "12px",
    height: "110px",
    marginBottom: "28px",
    overflow: "hidden",
  },
  loadingBar: {
    height: "100%",
    width: "40%",
    background: "linear-gradient(90deg, transparent, #dbeafe, transparent)",
    animation: "shimmer 1.5s infinite",
  },

  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },

  card: {
    padding: "20px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "default",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },

  iconBox: {
    width: "36px",
    height: "36px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },

  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    opacity: 0.6,
  },

  value: {
    fontSize: "30px",
    fontWeight: "800",
    lineHeight: 1,
  },

  title: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#8fa3c0",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
};

export default StatsCards;

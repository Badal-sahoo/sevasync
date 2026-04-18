import React, { useEffect, useState } from "react";
import { matchVolunteers, assignTask } from "../services/ngoApi";

const MatchModal = ({ taskId, onClose, onAssigned }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await matchVolunteers(taskId);
        setData(res);
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [taskId]);

  const handleAssign = async (volunteerId) => {
    try {
      setAssigningId(volunteerId);
      await assignTask(taskId, volunteerId);
      onAssigned();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Assignment failed ❌");
    } finally {
      setAssigningId(null);
    }
  };

  if (!taskId) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Recommended Volunteers</h2>
            {!loading && data && (
              <p style={styles.taskInfo}>
                <strong>{data.task.type}</strong>
                <span style={styles.dot}>•</span>
                <span
                  style={{
                    ...styles.urgencyBadge,
                    background: data.task.urgency === "HIGH" ? "#fff1f2" : data.task.urgency === "MEDIUM" ? "#fffbeb" : "#f0fdf4",
                    color: data.task.urgency === "HIGH" ? "#dc2626" : data.task.urgency === "MEDIUM" ? "#d97706" : "#059669",
                  }}
                >
                  {data.task.urgency}
                </span>
              </p>
            )}
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* DIVIDER */}
        <div style={styles.divider} />

        {/* CONTENT */}
        <div style={styles.content}>
          {loading ? (
            <div style={styles.loadingWrap}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={styles.skeletonCard} />
              ))}
            </div>
          ) : (
            data.recommended.map((v, idx) => (
              <div key={v.volunteer_id} style={styles.card}>
                {/* AVATAR */}
                <div style={{ ...styles.avatar, background: avatarColors[idx % avatarColors.length] }}>
                  {v.name.charAt(0).toUpperCase()}
                </div>

                {/* INFO */}
                <div style={styles.info}>
                  <h4 style={styles.name}>{v.name}</h4>
                  <div style={styles.skillsWrap}>
                    {v.skills.slice(0, 3).map((s, i) => (
                      <span key={i} style={styles.skillChip}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* RIGHT */}
                <div style={styles.right}>
                  <div style={styles.scoreBadge}>⭐ {v.score}</div>
                  <button
                    style={{
                      ...styles.button,
                      opacity: assigningId === v.volunteer_id ? 0.65 : 1,
                      cursor: assigningId === v.volunteer_id ? "not-allowed" : "pointer",
                    }}
                    disabled={assigningId === v.volunteer_id}
                    onClick={() => handleAssign(v.volunteer_id)}
                  >
                    {assigningId === v.volunteer_id ? "Assigning..." : "Assign"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const avatarColors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(10,31,92,0.45)",
    backdropFilter: "blur(6px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  modal: {
    width: "520px",
    maxHeight: "82vh",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "0",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 24px 60px rgba(10,31,92,0.18)",
    overflow: "hidden",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "22px 24px 14px",
  },

  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0a1f5c",
    margin: "0 0 4px",
  },

  taskInfo: {
    fontSize: "13px",
    color: "#5a7299",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    margin: 0,
  },

  dot: {
    color: "#c9d8ec",
  },

  urgencyBadge: {
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "600",
  },

  closeBtn: {
    background: "#f0f5ff",
    border: "none",
    color: "#5a7299",
    fontSize: "14px",
    cursor: "pointer",
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: "1px",
    background: "#e8eef8",
    margin: "0 24px",
  },

  content: {
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "16px 24px 22px",
  },

  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  skeletonCard: {
    height: "72px",
    background: "linear-gradient(90deg, #f0f5ff, #e8eef8, #f0f5ff)",
    borderRadius: "12px",
    backgroundSize: "200% 100%",
  },

  card: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "#f8faff",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #e2eaf5",
    transition: "border-color 0.2s",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "700",
    flexShrink: 0,
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    margin: "0 0 5px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#0a1f5c",
  },

  skillsWrap: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
  },

  skillChip: {
    padding: "2px 8px",
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "500",
    border: "1px solid #bfdbfe",
  },

  right: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px",
    flexShrink: 0,
  },

  scoreBadge: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#d97706",
    background: "#fffbeb",
    padding: "3px 8px",
    borderRadius: "6px",
    border: "1px solid #fde68a",
  },

  button: {
    padding: "7px 14px",
    background: "#2563eb",
    border: "none",
    borderRadius: "7px",
    color: "white",
    fontSize: "12px",
    fontWeight: "600",
  },
};

export default MatchModal;

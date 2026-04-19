import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { matchVolunteers, assignTask, completeTaskByNgo, getTaskById } from "../services/api";
import { getTaskUpdates } from "../services/api";

const TaskDetail = () => {
  const { id } = useParams();

  const [task, setTask] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updates, setUpdates] = useState([]);

  const isRequested = task && task.assignment_status === "requested";
  const isAssigned = task && task.status === "assigned";
  const alreadyRequested = task?.status === "requested";
  const isDisabled = sending || alreadyRequested;

  const fetchTask = async () => {
    try {
      const data = await getTaskById(id);
      setTask(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await matchVolunteers(id);
      setVolunteers(res.recommended);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUpdates = async () => {
  try {
    const data = await getTaskUpdates(id);

    setUpdates(data.updates || []);                // ✅ FIX
    setVolunteers(data.recommended_volunteers || []); // ✅ reuse
    // optionally:
    // setBestMatch(data.best_match)

  } catch (err) {
    console.error(err);
    setUpdates([]); // safety fallback
  }
};

  useEffect(() => {
    const load = async () => {
      await fetchTask();
      await fetchUpdates();
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAssign = async (volunteerId) => {
    try {
      setSending(true);
      await assignTask(id, volunteerId);
      await fetchTask();
    } catch (err) {
      alert("Request failed ❌");
    } finally {
      setSending(false);
    }
  };

  const handleComplete = async () => {
    try {
      await completeTaskByNgo({ taskId: id });
      alert("Task completed successfully");
      await fetchTask();
    } catch (err) {
      alert("Failed to complete task");
    }
  };

  if (loading)
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingSpinner}>Loading task...</div>
      </div>
    );

  if (!task) return <p style={{ color: "#ef4444", padding: "20px" }}>No task found</p>;

  const type = task.type || task.need_type || "unknown";

  const urgencyStyle = {
    HIGH: { color: "#dc2626", bg: "#fff1f2", border: "#fecdd3" },
    MEDIUM: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    LOW: { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  }[task.urgency] || { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };

  const avatarColors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];

  return (
    <div style={styles.container}>
      {/* TASK HEADER CARD */}
      <div style={styles.headerCard}>
        <div style={{ ...styles.headerAccent, background: urgencyStyle.color }} />
        <div style={styles.headerBody}>
          <div style={styles.headerTop}>
            <div>
              <h2 style={styles.taskType}>{type.toUpperCase()}</h2>
              <p style={styles.taskId}>Task #{id}</p>
            </div>
            <div style={styles.headerBadges}>
              <span
                style={{
                  ...styles.urgencyBadge,
                  color: urgencyStyle.color,
                  background: urgencyStyle.bg,
                  border: `1px solid ${urgencyStyle.border}`,
                }}
              >
                {task.urgency}
              </span>
              <span
                style={{
                  ...styles.statusBadge,
                  ...(isAssigned
                    ? { color: "#059669", background: "#f0fdf4", border: "1px solid #bbf7d0" }
                    : isRequested
                    ? { color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" }
                    : { color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe" }),
                }}
              >
                {task.status}
              </span>
            </div>
          </div>

          <div style={styles.metaGrid}>
            <div style={styles.metaItem}>
              <span style={styles.metaIcon}>📍</span>
              <span style={styles.metaText}>{task.location}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaIcon}>👥</span>
              <span style={styles.metaText}>{task.total_people} people</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaIcon}>⚡</span>
              <span style={styles.metaText}>Urgency: {task.urgency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BANNERS */}
      {isRequested && (
        <div style={styles.pendingBanner}>
          <div style={styles.bannerIcon}>📩</div>
          <div>
            <h4 style={styles.bannerTitle}>Request Sent</h4>
            <p style={styles.bannerSub}>Waiting for volunteer to respond...</p>
            {task.assigned_volunteer && (
              <p style={styles.bannerName}>👤 {task.assigned_volunteer.name}</p>
            )}
          </div>
        </div>
      )}

      {isAssigned && (
        <div style={styles.assignedBanner}>
          <div style={styles.bannerIcon}>✅</div>
          <div>
            <h4 style={styles.bannerTitle}>Task Assigned</h4>
            <p style={styles.bannerSub}>👤 {task.assigned_volunteer?.name}</p>
          </div>
        </div>
      )}

      {/* VOLUNTEERS */}
      {!isRequested && !isAssigned && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Recommended Volunteers</h3>
          <div style={styles.volGrid}>
            {volunteers.map((v, idx) => (
              <div key={v.volunteer_id} style={styles.volCard}>
                <div style={styles.volTop}>
                  <div
                    style={{
                      ...styles.volAvatar,
                      background: avatarColors[idx % avatarColors.length],
                    }}
                  >
                    {v.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.volInfo}>
                    <h4 style={styles.volName}>{v.name}</h4>
                    <div style={styles.scoreRow}>
                      <span style={styles.scoreBadge}>⭐ {v.score}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.skillsWrap}>
                  {v.skills.map((s, i) => (
                    <span key={i} style={styles.skillChip}>{s}</span>
                  ))}
                </div>

                <button
                  style={{
                    ...styles.assignBtn,
                    opacity: isDisabled ? 0.6 : 1,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                  }}
                  disabled={isDisabled}
                  onClick={() => handleAssign(v.volunteer_id)}
                >
                  {sending ? "Sending..." : alreadyRequested ? "Request Sent" : "Send Request"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPDATES */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Volunteer Updates</h3>
        <div style={styles.updatesBox}>
          {updates.length === 0 ? (
            <div style={styles.noUpdates}>
              <span style={styles.noUpdatesIcon}>📭</span>
              <p style={styles.noUpdatesText}>No updates yet</p>
            </div>
          ) : (
            updates.map((u, i) => (
              <div key={i} style={styles.updateItem}>
                <div style={styles.updateLeft}>
                  <div style={styles.updateAvatar}>{u.name?.charAt(0) || "?"}</div>
                </div>
                <div style={styles.updateBody}>
                  <div style={styles.updateHeader}>
                    <strong style={styles.updateName}>{u.name}</strong>
                    <span style={styles.updateTime}>{new Date(u.time).toLocaleString()}</span>
                  </div>
                  <p style={styles.updateMessage}>{u.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COMPLETE BUTTON */}
      {isAssigned && (
        <div style={styles.completeWrap}>
          <button style={styles.completeBtn} onClick={handleComplete}>
            ✓ Mark Task as Completed
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "4px 0",
    maxWidth: "860px",
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    color: "#0a1f5c",
  },

  loadingWrap: {
    display: "flex",
    justifyContent: "center",
    padding: "60px",
  },

  loadingSpinner: {
    color: "#8fa3c0",
    fontSize: "14px",
  },

  headerCard: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2eaf5",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(10,31,92,0.06)",
  },

  headerAccent: {
    height: "5px",
  },

  headerBody: {
    padding: "20px 24px",
  },

  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },

  taskType: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "0.8px",
    margin: "0 0 3px",
    color: "#0a1f5c",
  },

  taskId: {
    fontSize: "12px",
    color: "#8fa3c0",
    margin: 0,
  },

  headerBadges: {
    display: "flex",
    gap: "8px",
  },

  urgencyBadge: {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },

  statusBadge: {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  metaGrid: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },

  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  metaIcon: {
    fontSize: "14px",
  },

  metaText: {
    fontSize: "13px",
    color: "#5a7299",
  },

  pendingBanner: {
    display: "flex",
    gap: "14px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    padding: "16px 20px",
    borderRadius: "12px",
    alignItems: "flex-start",
  },

  assignedBanner: {
    display: "flex",
    gap: "14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    padding: "16px 20px",
    borderRadius: "12px",
    alignItems: "flex-start",
  },

  bannerIcon: {
    fontSize: "22px",
    flexShrink: 0,
  },

  bannerTitle: {
    margin: "0 0 3px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#0a1f5c",
  },

  bannerSub: {
    margin: 0,
    fontSize: "13px",
    color: "#5a7299",
  },

  bannerName: {
    margin: "4px 0 0",
    fontSize: "13px",
    fontWeight: "500",
    color: "#0a1f5c",
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  sectionTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0a1f5c",
    margin: 0,
  },

  volGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "14px",
  },

  volCard: {
    background: "#ffffff",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #e2eaf5",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    boxShadow: "0 2px 8px rgba(10,31,92,0.04)",
  },

  volTop: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  volAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    fontWeight: "700",
    flexShrink: 0,
  },

  volInfo: {
    flex: 1,
  },

  volName: {
    margin: "0 0 3px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#0a1f5c",
  },

  scoreRow: {
    display: "flex",
    gap: "6px",
  },

  scoreBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#d97706",
    background: "#fffbeb",
    padding: "2px 8px",
    borderRadius: "6px",
    border: "1px solid #fde68a",
  },

  skillsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
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

  assignBtn: {
    padding: "8px",
    background: "#2563eb",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: "600",
    fontSize: "13px",
    width: "100%",
    transition: "background 0.2s",
  },

  updatesBox: {
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2eaf5",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(10,31,92,0.04)",
  },

  noUpdates: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px",
    gap: "8px",
  },

  noUpdatesIcon: {
    fontSize: "28px",
  },

  noUpdatesText: {
    color: "#8fa3c0",
    fontSize: "13px",
    margin: 0,
  },

  updateItem: {
    display: "flex",
    gap: "12px",
    padding: "14px 16px",
    borderBottom: "1px solid #f0f5ff",
  },

  updateLeft: {
    flexShrink: 0,
  },

  updateAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
  },

  updateBody: {
    flex: 1,
  },

  updateHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },

  updateName: {
    fontSize: "13px",
    color: "#0a1f5c",
  },

  updateTime: {
    fontSize: "11px",
    color: "#8fa3c0",
  },

  updateMessage: {
    fontSize: "13px",
    color: "#5a7299",
    margin: 0,
    lineHeight: 1.5,
  },

  completeWrap: {
    display: "flex",
    justifyContent: "flex-end",
  },

  completeBtn: {
    padding: "12px 28px",
    background: "#059669",
    border: "none",
    borderRadius: "10px",
    color: "white",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    boxShadow: "0 4px 12px rgba(5,150,105,0.25)",
    transition: "all 0.2s",
  },
};

export default TaskDetail;

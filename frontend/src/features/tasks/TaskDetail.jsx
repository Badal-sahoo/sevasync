import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assignTask, completeTaskByNgo, getTaskById, getTaskUpdates } from "../../api/tasks";
import VolunteerCard from "./VolunteerCard";
import NgoLayout from "../../shared/NgoLayout";

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [matchWarning, setMatchWarning] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [updates, setUpdates] = useState([]);

  const isCompleted = task?.status === "completed";
  const isCancelled = task?.status === "cancelled";
  // Multiple volunteers can be assigned to one task — keep recommending until done.
  const canAssign = task ? task.can_assign !== false && !isCompleted && !isCancelled : false;

  const acceptedVolunteers = task?.accepted_volunteers || [];
  const requestedVolunteers = task?.requested_volunteers || [];
  const requestedIds = new Set(requestedVolunteers.map((v) => v.id));
  const acceptedIds = new Set(acceptedVolunteers.map((v) => v.id));

  const fetchTask = async () => {
    try {
      const data = await getTaskById(id);
      setTask(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUpdates = async () => {
    try {
      const data = await getTaskUpdates(id);
      setUpdates(data.updates || []);
      setVolunteers(data.recommended_volunteers || []);
      setMatchWarning(data.match_warning || "");
    } catch (err) {
      console.error(err);
      setUpdates([]);
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
      setSendingId(volunteerId);
      await assignTask(id, volunteerId);
      // Refresh both the task (assigned/requested lists) and the recommendations.
      await fetchTask();
      await fetchUpdates();
    } catch (err) {
      alert(err?.response?.data?.error || "Request failed");
    } finally {
      setSendingId(null);
    }
  };

  const handleComplete = async () => {
    try {
      await completeTaskByNgo(id);
      alert("Task completed successfully");
      await fetchTask();
    } catch (err) {
      alert("Failed to complete task");
    }
  };

  if (loading) return (
    <NgoLayout active="TaskList" title="Task Detail" onBack={() => navigate(-1)}>
      <div style={styles.loadingWrap}><div style={styles.loadingSpinner}>Loading task...</div></div>
    </NgoLayout>
  );
  if (!task) return (
    <NgoLayout active="TaskList" title="Task Detail" onBack={() => navigate(-1)}>
      <p style={{ color: "#ef4444", padding: "20px" }}>No task found</p>
    </NgoLayout>
  );

  const type = task.type || task.need_type || "unknown";

  const urgencyStyle = {
    HIGH: { color: "#dc2626", bg: "#fff1f2", border: "#fecdd3" },
    MEDIUM: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    LOW: { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  }[task.urgency] || { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };

  return (
    <NgoLayout active="TaskList" title={`Task #${id}`} subtitle={type.toUpperCase()} onBack={() => navigate(-1)}>
    <div style={styles.container}>
      {/* TASK HEADER */}
      <div style={styles.headerCard}>
        <div style={{ ...styles.headerAccent, background: urgencyStyle.color }} />
        <div style={styles.headerBody}>
          <div style={styles.headerTop}>
            <div>
              <h2 style={styles.taskType}>{type.toUpperCase()}</h2>
              <p style={styles.taskId}>Task #{id}</p>
            </div>
            <div style={styles.headerBadges}>
              <span style={{ ...styles.urgencyBadge, color: urgencyStyle.color, background: urgencyStyle.bg, border: `1px solid ${urgencyStyle.border}` }}>
                {task.urgency}
              </span>
              <span style={{
                ...styles.statusBadge,
                ...(task.status === "assigned"
                  ? { color: "#059669", background: "#f0fdf4", border: "1px solid #bbf7d0" }
                  : task.status === "requested"
                  ? { color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" }
                  : task.status === "completed"
                  ? { color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe" }
                  : task.status === "cancelled"
                  ? { color: "#dc2626", background: "#fff1f2", border: "1px solid #fecdd3" }
                  : { color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe" }),
              }}>
                {task.status}
              </span>
            </div>
          </div>

          <div style={styles.metaGrid}>
            <div style={styles.metaItem}><span style={styles.metaIcon}>📍</span><span style={styles.metaText}>{task.location}</span></div>
            <div style={styles.metaItem}><span style={styles.metaIcon}>👥</span><span style={styles.metaText}>{task.total_people} people</span></div>
            <div style={styles.metaItem}><span style={styles.metaIcon}>⚡</span><span style={styles.metaText}>Urgency: {task.urgency}</span></div>
          </div>
        </div>
      </div>

      {/* ASSIGNED / REQUESTED VOLUNTEERS SUMMARY */}
      {acceptedVolunteers.length > 0 && (
        <div style={styles.assignedBanner}>
          <div style={styles.bannerIcon}>✅</div>
          <div>
            <h4 style={styles.bannerTitle}>
              Working on this task ({acceptedVolunteers.length})
            </h4>
            <p style={styles.bannerSub}>
              {acceptedVolunteers.map((v) => `👤 ${v.name}`).join("   ")}
            </p>
          </div>
        </div>
      )}

      {requestedVolunteers.length > 0 && (
        <div style={styles.pendingBanner}>
          <div style={styles.bannerIcon}>📩</div>
          <div>
            <h4 style={styles.bannerTitle}>
              Awaiting response ({requestedVolunteers.length})
            </h4>
            <p style={styles.bannerSub}>
              {requestedVolunteers.map((v) => `👤 ${v.name}`).join("   ")}
            </p>
          </div>
        </div>
      )}

      {/* RECOMMENDED VOLUNTEERS — keep open so the NGO can add several */}
      {canAssign && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            Recommended Volunteers
            <span style={{ fontSize: "12px", color: "#8fa3c0", fontWeight: 500, marginLeft: "8px" }}>
              (you can assign more than one)
            </span>
          </h3>
          {matchWarning && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#92400e", fontWeight: 600 }}>
              ⚠️ {matchWarning}
            </div>
          )}
          <div style={styles.volGrid}>
            {volunteers.map((v, idx) => {
              const state = acceptedIds.has(v.volunteer_id)
                ? "accepted"
                : requestedIds.has(v.volunteer_id)
                ? "requested"
                : sendingId === v.volunteer_id
                ? "sending"
                : "send";
              return (
                <VolunteerCard
                  key={v.volunteer_id}
                  volunteer={v}
                  index={idx}
                  onAssign={handleAssign}
                  state={state}
                />
              );
            })}
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

      {/* COMPLETE BUTTON — available once at least one volunteer is on it */}
      {acceptedVolunteers.length > 0 && !isCompleted && !isCancelled && (
        <div style={styles.completeWrap}>
          <button style={styles.completeBtn} onClick={handleComplete}>
            ✓ Mark Task as Completed
          </button>
        </div>
      )}

      {isCompleted && (
        <div style={{ ...styles.assignedBanner, background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
          <div style={styles.bannerIcon}>🏁</div>
          <div>
            <h4 style={styles.bannerTitle}>Task Completed</h4>
            <p style={styles.bannerSub}>Points have been awarded to the assigned volunteers.</p>
          </div>
        </div>
      )}
    </div>
    </NgoLayout>
  );
};

const styles = {
  container: { padding: "4px 0", maxWidth: "860px", margin: "auto", display: "flex", flexDirection: "column", gap: "18px", color: "#0a1f5c" },
  loadingWrap: { display: "flex", justifyContent: "center", padding: "60px" },
  loadingSpinner: { color: "#8fa3c0", fontSize: "14px" },
  headerCard: { background: "#ffffff", borderRadius: "16px", border: "1px solid #e2eaf5", overflow: "hidden", boxShadow: "0 2px 10px rgba(10,31,92,0.06)" },
  headerAccent: { height: "5px" },
  headerBody: { padding: "20px 24px" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  taskType: { fontSize: "20px", fontWeight: "800", letterSpacing: "0.8px", margin: "0 0 3px", color: "#0a1f5c" },
  taskId: { fontSize: "12px", color: "#8fa3c0", margin: 0 },
  headerBadges: { display: "flex", gap: "8px" },
  urgencyBadge: { padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px" },
  statusBadge: { padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },
  metaGrid: { display: "flex", gap: "24px", flexWrap: "wrap" },
  metaItem: { display: "flex", alignItems: "center", gap: "6px" },
  metaIcon: { fontSize: "14px" },
  metaText: { fontSize: "13px", color: "#5a7299" },
  pendingBanner: { display: "flex", gap: "14px", background: "#fffbeb", border: "1px solid #fde68a", padding: "16px 20px", borderRadius: "12px", alignItems: "flex-start" },
  assignedBanner: { display: "flex", gap: "14px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px 20px", borderRadius: "12px", alignItems: "flex-start" },
  bannerIcon: { fontSize: "22px", flexShrink: 0 },
  bannerTitle: { margin: "0 0 3px", fontSize: "14px", fontWeight: "700", color: "#0a1f5c" },
  bannerSub: { margin: 0, fontSize: "13px", color: "#5a7299" },
  bannerName: { margin: "4px 0 0", fontSize: "13px", fontWeight: "500", color: "#0a1f5c" },
  section: { display: "flex", flexDirection: "column", gap: "14px" },
  sectionTitle: { fontSize: "15px", fontWeight: "700", color: "#0a1f5c", margin: 0 },
  volGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "14px" },
  updatesBox: { background: "#ffffff", borderRadius: "12px", border: "1px solid #e2eaf5", overflow: "hidden", boxShadow: "0 2px 8px rgba(10,31,92,0.04)" },
  noUpdates: { display: "flex", flexDirection: "column", alignItems: "center", padding: "32px", gap: "8px" },
  noUpdatesIcon: { fontSize: "28px" },
  noUpdatesText: { color: "#8fa3c0", fontSize: "13px", margin: 0 },
  updateItem: { display: "flex", gap: "12px", padding: "14px 16px", borderBottom: "1px solid #f0f5ff" },
  updateLeft: { flexShrink: 0 },
  updateAvatar: { width: "34px", height: "34px", borderRadius: "50%", background: "#2563eb", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700" },
  updateBody: { flex: 1 },
  updateHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  updateName: { fontSize: "13px", color: "#0a1f5c" },
  updateTime: { fontSize: "11px", color: "#8fa3c0" },
  updateMessage: { fontSize: "13px", color: "#5a7299", margin: 0, lineHeight: 1.5 },
  completeWrap: { display: "flex", justifyContent: "flex-end" },
  completeBtn: { padding: "12px 28px", background: "#059669", border: "none", borderRadius: "10px", color: "white", cursor: "pointer", fontWeight: "700", fontSize: "14px", boxShadow: "0 4px 12px rgba(5,150,105,0.25)", transition: "all 0.2s" },
};

export default TaskDetail;

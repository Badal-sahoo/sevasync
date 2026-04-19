import React from "react";

const TaskCard = ({ task, onFindVolunteers }) => {
  const type = task.type || task.need_type || "unknown";

  const urgencyMap = {
    HIGH: { color: "#dc2626", bg: "#fff1f2", border: "#fecdd3", label: "HIGH" },
    MEDIUM: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "MEDIUM" },
    LOW: { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", label: "LOW" },
  };

  const urgency = urgencyMap[task.urgency] || urgencyMap.LOW;

  const isAssigned = task.status === "assigned";
  const isCompleted = task.status === "completed";
  const isRequested = task.assignment_status === "requested";

  const handleClick = () => {
    if (isAssigned || isCompleted) {
      onFindVolunteers(task.id);
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        cursor: isAssigned || isCompleted ? "pointer" : "default",
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 10px 28px rgba(10,31,92,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 10px rgba(10,31,92,0.06)";
      }}
    >
      {/* TOP ACCENT BAR */}
      <div style={{ ...styles.accentBar, background: urgency.color }} />

      {/* HEADER */}
      <div style={styles.header}>
        <h3 style={styles.title}>{type.toUpperCase()}</h3>
        <span
          style={{
            ...styles.badge,
            color: urgency.color,
            background: urgency.bg,
            border: `1px solid ${urgency.border}`,
          }}
        >
          {urgency.label}
        </span>
      </div>

      {/* BODY */}
      <div style={styles.body}>
        <div style={styles.infoRow}>
          <span style={styles.infoIcon}>📍</span>
          <span style={styles.infoText}>
            {task.location_name || task.location}
          </span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoIcon}>👥</span>
          <span style={styles.infoText}>{task.total_people} people affected</span>
        </div>
      </div>

      {/* DIVIDER */}
      <div style={styles.divider} />

      {/* FOOTER */}
      <div style={styles.footer}>
        {isAssigned && task.assigned_volunteer && (
          <div style={styles.assignedBox}>
            <span style={styles.assignedDot} />
            Assigned to <strong>{task.assigned_volunteer.name}</strong>
          </div>
        )}

        {isRequested && !isAssigned && (
          <div style={styles.pendingBox}>
            <span>⏳</span> Request Sent — Awaiting Response
          </div>
        )}

        {!isRequested && !isAssigned && !isCompleted && (
          <button
            style={styles.button}
            onClick={(e) => {
              e.stopPropagation();
              onFindVolunteers(task.id);
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
          >
            Find Volunteers →
          </button>
        )}

        {isCompleted && (
          <button
            style={styles.viewBtn}
            onClick={(e) => {
              e.stopPropagation();
              onFindVolunteers(task.id);
            }}
          >
            View Details →
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: "#ffffff",
    color: "#0a1f5c",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    minHeight: "200px",
    boxShadow: "0 2px 10px rgba(10,31,92,0.06)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    overflow: "hidden",
    border: "1px solid #e2eaf5",
  },

  accentBar: {
    height: "4px",
    width: "100%",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "16px 18px 8px",
  },

  title: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0a1f5c",
    letterSpacing: "0.8px",
    margin: 0,
  },

  badge: {
    padding: "3px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },

  body: {
    padding: "4px 18px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  infoIcon: {
    fontSize: "13px",
  },

  infoText: {
    fontSize: "13px",
    color: "#5a7299",
  },

  divider: {
    height: "1px",
    background: "#e8eef8",
    margin: "0 18px",
  },

  footer: {
    padding: "12px 18px 16px",
    marginTop: "auto",
  },

  button: {
    width: "100%",
    padding: "9px",
    background: "#2563eb",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "background 0.2s ease",
  },

  viewBtn: {
    width: "100%",
    padding: "9px",
    background: "#7c3aed",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },

  pendingBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 10px",
    background: "#fffbeb",
    color: "#92400e",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    border: "1px solid #fde68a",
  },

  assignedBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 10px",
    background: "#f0fdf4",
    color: "#14532d",
    borderRadius: "8px",
    fontSize: "12px",
    border: "1px solid #bbf7d0",
  },

  assignedDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#22c55e",
    flexShrink: 0,
  },
};

export default TaskCard;

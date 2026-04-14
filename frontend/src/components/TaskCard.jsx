import React from "react";

const TaskCard = ({ task, onFindVolunteers }) => {
  const type = task.type || task.need_type || "unknown";

  const getColor = (urgency) => {
    if (urgency === "HIGH") return "red";
    if (urgency === "MEDIUM") return "orange";
    return "green";
  };

  return (
    <div style={styles.card}>
      {/* HEADER */}
      <div style={styles.header}>
        <h3>{type.toUpperCase()}</h3>
        <span
          style={{
            ...styles.badge,
            background: getColor(task.urgency),
          }}
        >
          {task.urgency}
        </span>
      </div>

      {/* BODY */}
      <div style={styles.body}>
        <p>📍 {task.location}</p>
        <p>👥 {task.total_people} people</p>
      </div>

      {/* 🔥 STATE HANDLING */}

      {/* ✅ ASSIGNED */}
      {task.status === "assigned" && task.assigned_volunteer && (
        <div style={styles.assignedBox}>
          Assigned to {task.assigned_volunteer.name} ✅
        </div>
      )}

      {/* ⏳ REQUEST SENT */}
      {task.assignment_status === "requested" &&
        task.status !== "assigned" && (
          <div style={styles.pendingBox}>
            Request Sent ⏳
          </div>
        )}

      {/* 🔥 AVAILABLE */}
      {(!task.assignment_status ||
        task.assignment_status !== "requested") &&
        task.status !== "assigned" && (
          <button
            style={styles.button}
            onClick={() => onFindVolunteers(task.id)}
          >
            Find Volunteers →
          </button>
        )}
    </div>
  );
};

const styles = {
  card: {
    background: "#1e293b",
    color: "white",
    padding: "15px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    height: "220px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
  },
  badge: {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
  },
  body: {
    marginTop: "10px",
    fontSize: "14px",
  },
  button: {
    marginTop: "auto",
    padding: "8px",
    background: "#0ea5e9",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
  },
  pendingBox: {
    marginTop: "auto",
    padding: "8px",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: "6px",
    textAlign: "center",
    fontSize: "14px",
  },
  assignedBox: {
    marginTop: "auto",
    padding: "8px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "6px",
    textAlign: "center",
    fontSize: "14px",
  },
};

export default TaskCard;
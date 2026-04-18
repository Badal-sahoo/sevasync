import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { matchVolunteers, assignTask } from "../services/ngoApi";
import { getTaskUpdates } from "../services/api";
import { completeTaskByNgo } from "../services/ngoApi";
const TaskDetail = () => {
  const { id } = useParams();

  const [task, setTask] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updates, setUpdates] = useState([]);
  const isRequested = task && task.assignment_status === "requested";
  const isAssigned = task && task.status === "assigned";

  // fetch task
  const fetchTask = async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/task/${id}/`
      );
      setTask(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // fetch recommended volunteers
  const fetchMatches = async () => {
    try {
      const res = await matchVolunteers(id);
      setVolunteers(res.recommended);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchTask();
      await fetchMatches();
      setLoading(false);
    };
    load();
  }, [id]);

  const fetchUpdates = async () => {
    const data = await getTaskUpdates(id);
    setUpdates(data);
  };

  useEffect(() => {
    fetchUpdates();
  }, [id]);
  // 🔥 SEND REQUEST
  const handleAssign = async (volunteerId) => {
    try {
      setSending(true);

      await assignTask(id, volunteerId);

      await fetchTask(); // refresh UI
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
    } catch (err) {
      alert("Failed to complete task");
    }
  };
  const isDisabled = sending || task.status === "requested" || alreadyRequested;

  if (loading) return <p>Loading...</p>;
  if (!task) return <p>No task found</p>;

  const type = task.type || task.need_type || "unknown";

  return (
    <div style={styles.container}>

      {/* TASK INFO */}
      <div style={styles.card}>
        <h2>{type.toUpperCase()}</h2>
        <p>📍 {task.location}</p>
        <p>👥 {task.total_people} people</p>
        <p>⚡ {task.urgency}</p>
        <p>Status: {task.status}</p>
      </div>

      {/* 🟡 REQUEST SENT */}
      {isRequested && (
        <div style={styles.pendingBox}>
          <h3>📩 Request Sent</h3>
          <p>Waiting for volunteer response...</p>

          {task.assigned_volunteer && (
            <p>👤 {task.assigned_volunteer.name}</p>
          )}
        </div>
      )}

      {/* 🟢 ASSIGNED */}
      {isAssigned && (
        <div style={styles.assignedBox}>
          <h3>✅ Task Assigned</h3>
          <p>👤 {task.assigned_volunteer?.name}</p>
        </div>
      )}

      {/* 🔵 SHOW ONLY WHEN FRESH */}
      {!isRequested && !isAssigned && (
        <>
          <h3>Recommended Volunteers</h3>

          {volunteers.map((v) => (
            <div key={v.volunteer_id} style={styles.volCard}>
              <p><strong>{v.name}</strong></p>
              <p>{v.skills.join(", ")}</p>
              <p>Score: {v.score}</p>

              <button
                style={styles.button}
                disabled={isDisabled}
                onClick={() => handleAssign(v.volunteer_id)}
              >
                {sending
                  ? "Sending..."
                  : alreadyRequested || task.status === "requested"
                    ? "Request Sent"
                    : "Send Request"}
              </button>
            </div>
          ))}
        </>
      )}
      <div>
        <h3>Volunteer Updates</h3>

        {updates.map((u, i) => (
          <div key={i}>
            <strong>{u.name}</strong>
            <p>{u.message}</p>
            <small>{new Date(u.time).toLocaleString()}</small>
          </div>
        ))}
      </div>
      <button onClick={handleComplete}>
        Mark Task as Completed
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "700px",
    margin: "auto",
  },

  card: {
    background: "#1e293b",
    color: "white",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
  },

  volCard: {
    background: "white",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "10px",
    border: "1px solid #e2e8f0",
  },

  button: {
    marginTop: "8px",
    padding: "8px 12px",
    background: "#0ea5e9",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  pendingBox: {
    background: "#fef3c7",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #facc15",
    marginBottom: "15px",
  },

  assignedBox: {
    background: "#dcfce7",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #22c55e",
    marginBottom: "15px",
  },
};

export default TaskDetail;
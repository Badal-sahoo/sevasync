import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { addTaskUpdate, getTaskUpdates } from "../services/api";
import "./VolunteerTaskDetail.css";
import { getTaskById } from "../services/api";

const VolunteerTaskDetail = () => {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [message, setMessage] = useState("");
 const fetchTask = async () => {
  try {
    const data = await getTaskById(taskId);
    setTask(data);
  } catch (err) {
    console.error(err);
  }
};
  const fetchUpdates = async () => {
    try {
      const data = await getTaskUpdates(taskId);
      setUpdates(data.updates || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTask();      // ✅ ADD THIS
    fetchUpdates();
  }, [taskId]);

  const handleAddUpdate = async () => {
    if (!message.trim()) return;

    try {
      await addTaskUpdate( taskId, message );
      setMessage("");
      fetchUpdates(); // refresh
    } catch (err) {
      alert("Failed to add update");
    }
  };

  return (
    <div className="task-detail">
      <h2>Task Progress</h2>
{task && (
  <div className="task-header">
    <h2>{task.need_type?.toUpperCase()}</h2>

    <p><strong>📍 Location:</strong> {task.location_name || task.location}</p>

    <p><strong>⚡ Urgency:</strong> {task.urgency}</p>

    <p><strong>👥 People:</strong> {task.total_people}</p>

    <p><strong>Status:</strong> {task.status}</p>
  </div>
)}
      {/* 📝 Add update */}
      <div className="update-box">
        <textarea
          placeholder="Write your update..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={handleAddUpdate}>Submit Update</button>
      </div>

      {/* 📜 Updates list */}
      <div className="updates-list">
        {updates.map((u, i) => (
          <div key={i} className="update-item">
            <p><strong>{u.name}</strong></p>
            <p>{u.message}</p>
            <span>{new Date(u.time).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VolunteerTaskDetail;
import { useState } from "react";
import { respondToVolunteerTask } from "../services/api";
import "./VolunteerTaskCard.css";

const getUrgencyClass = (urgency) => {
  const u = (urgency || "").toUpperCase();
  if (u === "HIGH") return "volunteer-task-card__urgency--high";
  if (u === "MEDIUM") return "volunteer-task-card__urgency--medium";
  return "volunteer-task-card__urgency--low";
};

const VolunteerTaskCard = ({
  task,
  onTaskUpdated,
  onTaskActionSuccess,
  onTaskClick,
}) => {
  const [activeAction, setActiveAction] = useState("");
  const [feedback, setFeedback] = useState("");

  const taskId = task.task_id ?? task.id;
  const taskType = task.type || task.need_type || "Support";
  const peopleCount = task.people ?? task.total_needs ?? 0;

  const assignmentStatus = task.assignmentStatus || task.status || "requested";

  const isAccepted = assignmentStatus === "accepted";
  const isCompleted = assignmentStatus === "completed";

  const actionsDisabled = activeAction !== "";

  const handleRespond = async (action) => {
    setActiveAction(action);
    setFeedback("");

    try {
      await respondToVolunteerTask(taskId, action);

      if (action === "accept") {
        onTaskUpdated?.(taskId, {
          assignmentStatus: "accepted",
          status: "assigned",
        });
        setFeedback("✅ Task accepted");
      } else {
        onTaskUpdated?.(taskId, { remove: true });
        setFeedback("❌ Task rejected");
      }

      onTaskActionSuccess?.();
    } catch (error) {
      console.error(`Error trying to ${action}:`, error);
      setFeedback("⚠️ Failed to update task");
    } finally {
      setActiveAction("");
    }
  };

  return (
    <article className="volunteer-task-card">
      {/* 🔹 HEADER */}
      <div className="volunteer-task-card__top">
        <div>
          <p className="volunteer-task-card__label">Task Type</p>
          <h3 className="volunteer-task-card__title">{taskType}</h3>
        </div>

        <span className={`volunteer-task-card__urgency ${getUrgencyClass(task.urgency)}`}>
          <span className="urgency-dot"></span>
          {(task.urgency || "LOW").toUpperCase()}
        </span>
      </div>

      {/* 🔹 META */}
      <div className="volunteer-task-card__meta">
        <div className="volunteer-task-card__meta-item">
          <span className="volunteer-task-card__meta-label">
            <svg className="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location
          </span>
          <strong>
            {task.location_name || task.location || "Unknown"}
          </strong>
        </div>

        <div className="volunteer-task-card__meta-item">
          <span className="volunteer-task-card__meta-label">
            <svg className="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            People
          </span>
          <strong>{peopleCount}</strong>
        </div>

        <div className="volunteer-task-card__meta-item">
          <span className="volunteer-task-card__meta-label">
            <svg className="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Status
          </span>
          <strong className="status-text">{assignmentStatus}</strong>
        </div>
      </div>

      {/* 🔹 ACTIONS */}
      <div className="volunteer-task-card__actions">
        {!isAccepted && !isCompleted ? (
          <div className="volunteer-task-card__actions-group">
            <button
              className="volunteer-task-card__button volunteer-task-card__button--accept"
              disabled={actionsDisabled}
              onClick={() => handleRespond("accept")}
            >
              {activeAction === "accept" ? "Accepting..." : "Accept"}
            </button>
            <button
              className="volunteer-task-card__button volunteer-task-card__button--reject"
              disabled={actionsDisabled}
              onClick={() => handleRespond("reject")}
            >
              {activeAction === "reject" ? "Rejecting..." : "Reject"}
            </button>
          </div>
        ) : (
          <button
            className="volunteer-task-card__button volunteer-task-card__button--view"
            onClick={() => onTaskClick(taskId)}
          >
            View Details →
          </button>
        )}
      </div>

      {/* 🔹 FEEDBACK */}
      {feedback && (
        <p className="volunteer-task-card__feedback">{feedback}</p>
      )}
    </article>
  );
};

export default VolunteerTaskCard;
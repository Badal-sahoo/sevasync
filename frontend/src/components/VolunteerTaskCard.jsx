import { useState } from "react";
import { completeVolunteerTask, respondToVolunteerTask } from "../services/api";
import "./VolunteerTaskCard.css";

const getUrgencyClass = (urgency) => {
  const normalizedUrgency = (urgency || "").toUpperCase();

  if (normalizedUrgency === "HIGH") return "volunteer-task-card__urgency--high";
  if (normalizedUrgency === "MEDIUM") return "volunteer-task-card__urgency--medium";
  return "volunteer-task-card__urgency--low";
};

const VolunteerTaskCard = ({ task, onTaskUpdated, onTaskActionSuccess }) => {
  const [activeAction, setActiveAction] = useState("");
  const [feedback, setFeedback] = useState("");

  const taskId = task.task_id ?? task.id;
  const taskType = task.type || task.need_type || "Support";
  const peopleCount = task.people ?? task.total_needs ?? 0;

  // ✅ FIXED status handling
  const assignmentStatus =
    task.assignmentStatus || task.status || "requested";

  const isAccepted = assignmentStatus === "accepted";
  const isCompleted = assignmentStatus === "completed";

  const actionsDisabled = activeAction !== "";

  // =========================
  // ✅ ACCEPT / REJECT
  // =========================
  const handleRespond = async (action) => {
    setActiveAction(action);
    setFeedback("");

    try {
      await respondToVolunteerTask({
        taskId,
        action,
      });

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
      console.error(`Error trying to ${action} task:`, error);
      setFeedback("⚠️ Failed to update task");
    } finally {
      setActiveAction("");
    }
  };

  // =========================
  // ✅ COMPLETE TASK
  // =========================
  const handleComplete = async () => {
    setActiveAction("complete");
    setFeedback("");

    try {
      const response = await completeVolunteerTask({
        taskId,
      });

      onTaskUpdated?.(taskId, {
        assignmentStatus: "completed",
        status: "completed",
      });

      setFeedback(`🎉 Task completed (+${response?.points_earned ?? 0} pts)`);
      onTaskActionSuccess?.();
    } catch (error) {
      console.error("Error marking task done:", error);
      setFeedback("⚠️ Could not complete task");
    } finally {
      setActiveAction("");
    }
  };

  return (
    <article className="volunteer-task-card">
      <div className="volunteer-task-card__top">
        <div>
          <p className="volunteer-task-card__label">Task Type</p>
          <h3 className="volunteer-task-card__title">{taskType}</h3>
        </div>
        <span
          className={`volunteer-task-card__urgency ${getUrgencyClass(task.urgency)}`}
        >
          {(task.urgency || "LOW").toUpperCase()}
        </span>
      </div>

      <div className="volunteer-task-card__meta">
        <div className="volunteer-task-card__meta-item">
          <span>Location</span>
          <strong>{task.location || "Unknown"}</strong>
        </div>
        <div className="volunteer-task-card__meta-item">
          <span>People</span>
          <strong>{peopleCount}</strong>
        </div>
        <div className="volunteer-task-card__meta-item">
          <span>Status</span>
          <strong>{assignmentStatus}</strong>
        </div>
      </div>

      {/* =========================
          ✅ ACTION BUTTONS
      ========================= */}
      <div className="volunteer-task-card__actions">
        {/* 🔹 ACCEPT / REJECT */}
        {!isAccepted && !isCompleted && (
          <>
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
          </>
        )}

        {/* 🔹 MARK COMPLETE */}
        {isAccepted && (
          <button
            className="volunteer-task-card__button volunteer-task-card__button--done"
            disabled={actionsDisabled}
            onClick={handleComplete}
          >
            {activeAction === "complete" ? "Marking..." : "Mark Done"}
          </button>
        )}

        {/* 🔹 COMPLETED */}
        {isCompleted && (
          <button
            className="volunteer-task-card__button volunteer-task-card__button--complete"
            disabled
          >
            Completed
          </button>
        )}
      </div>

      {feedback && <p className="volunteer-task-card__feedback">{feedback}</p>}
    </article>
  );
};

export default VolunteerTaskCard;
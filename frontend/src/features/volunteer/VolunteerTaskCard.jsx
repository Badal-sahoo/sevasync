import { useState } from "react";
import { respondToVolunteerTask } from "../../api/tasks";

const urgencyClasses = (urgency) => {
  const u = (urgency || "").toUpperCase();
  if (u === "HIGH") return { wrap: "bg-rose-50 text-rose-500", dot: "bg-rose-500" };
  if (u === "MEDIUM") return { wrap: "bg-amber-50 text-amber-600", dot: "bg-amber-500" };
  return { wrap: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" };
};

const MetaItem = ({ label, icon, children }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
    <span className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
      {label}
    </span>
    <strong className="block text-[15px] font-bold text-[#0a1f5c]">{children}</strong>
  </div>
);

const VolunteerTaskCard = ({ task, onTaskUpdated, onTaskActionSuccess, onTaskClick }) => {
  const [activeAction, setActiveAction] = useState("");
  const [feedback, setFeedback] = useState("");

  const taskId = task.task_id ?? task.id;
  const taskType = task.type || task.need_type || "Support";
  const peopleCount = task.total_people ?? 0;
  const assignmentStatus = task.assignmentStatus || task.status || "requested";
  const isAccepted = assignmentStatus === "accepted";
  const isCompleted = assignmentStatus === "completed";
  const actionsDisabled = activeAction !== "";
  const urgency = urgencyClasses(task.urgency);

  const handleRespond = async (action) => {
    setActiveAction(action);
    setFeedback("");
    try {
      await respondToVolunteerTask(taskId, action);
      if (action === "accept") {
        onTaskUpdated?.(taskId, { assignmentStatus: "accepted", status: "assigned" });
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

  const btnBase =
    "flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-[#e2eaf5] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">Task Type</p>
          <h3 className="text-lg font-bold capitalize text-[#0a1f5c]">{taskType}</h3>
        </div>
        <span className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold tracking-wide ${urgency.wrap}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${urgency.dot}`} />
          {(task.urgency || "LOW").toUpperCase()}
        </span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-3 gap-3">
        <MetaItem
          label="Location"
          icon={<><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></>}
        >
          <span className="line-clamp-2 text-[13px]">{task.location_name || task.location || "Unknown"}</span>
        </MetaItem>
        <MetaItem
          label="People"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
        >
          {peopleCount}
        </MetaItem>
        <MetaItem
          label="Status"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
        >
          <span className="capitalize">{assignmentStatus}</span>
        </MetaItem>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        {!isAccepted && !isCompleted ? (
          <div className="flex gap-2.5">
            <button
              className={`${btnBase} bg-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:bg-blue-700`}
              disabled={actionsDisabled}
              onClick={() => handleRespond("accept")}
            >
              {activeAction === "accept" ? "Accepting..." : "Accept"}
            </button>
            <button
              className={`${btnBase} border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200`}
              disabled={actionsDisabled}
              onClick={() => handleRespond("reject")}
            >
              {activeAction === "reject" ? "Rejecting..." : "Reject"}
            </button>
          </div>
        ) : (
          <button
            className="w-full rounded-xl border-[1.5px] border-blue-200 bg-transparent px-4 py-3 text-sm font-semibold text-blue-600 transition hover:border-blue-500 hover:bg-blue-50"
            onClick={() => onTaskClick(taskId)}
          >
            View Details →
          </button>
        )}
      </div>

      {feedback && (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-center text-sm font-semibold text-blue-700">
          {feedback}
        </p>
      )}
    </article>
  );
};

export default VolunteerTaskCard;

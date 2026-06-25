import React from "react";

const URGENCY = {
  HIGH: { text: "text-rose-600", pill: "bg-rose-50 text-rose-600 border-rose-200", accent: "bg-rose-500" },
  MEDIUM: { text: "text-amber-600", pill: "bg-amber-50 text-amber-600 border-amber-200", accent: "bg-amber-500" },
  LOW: { text: "text-emerald-600", pill: "bg-emerald-50 text-emerald-600 border-emerald-200", accent: "bg-emerald-500" },
};

const STATUS_PILL = {
  pending: "bg-slate-100 text-slate-600",
  requested: "bg-amber-50 text-amber-700",
  assigned: "bg-emerald-50 text-emerald-700",
  completed: "bg-violet-50 text-violet-700",
  cancelled: "bg-rose-50 text-rose-600",
};

const TaskCard = ({ task, onFindVolunteers }) => {
  const type = task.type || task.need_type || "unknown";
  const urgency = URGENCY[task.urgency] || URGENCY.LOW;

  const isAssigned = task.status === "assigned";
  const isCompleted = task.status === "completed";
  const isCancelled = task.status === "cancelled";
  const isRequested = task.status === "requested" || task.assignment_status === "requested";
  const clickable = isAssigned || isCompleted;

  const open = () => onFindVolunteers(task.id);

  return (
    <div
      onClick={() => clickable && open()}
      className={`group flex min-h-[230px] flex-col overflow-hidden rounded-2xl border border-[#e2eaf5] bg-white shadow-[0_2px_10px_rgba(10,31,92,0.06)] transition hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(10,31,92,0.1)] ${
        clickable ? "cursor-pointer" : ""
      }`}
    >
      {/* top accent */}
      <div className={`h-1.5 w-full ${urgency.accent}`} />

      {/* header */}
      <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-5">
        <div>
          <h3 className="text-[17px] font-extrabold uppercase tracking-wide text-[#0a1f5c]">{type}</h3>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${STATUS_PILL[task.status] || STATUS_PILL.pending}`}>
            {task.status}
          </span>
        </div>
        <span className={`flex-shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${urgency.pill}`}>
          {task.urgency || "LOW"}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-col gap-2.5 px-5 pb-4 pt-1">
        <div className="flex items-center gap-2.5 text-sm text-[#5a7299]">
          <span>📍</span>
          <span className="line-clamp-1">{task.location_name || task.location || "Unknown"}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-[#5a7299]">
          <span>👥</span>
          <span>{task.total_people} people affected</span>
        </div>
      </div>

      {/* footer */}
      <div className="mt-auto border-t border-[#eef3fb] px-5 py-4">
        {isAssigned && task.assigned_volunteer && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Assigned to <strong>{task.assigned_volunteer.name}</strong>
          </div>
        )}

        {isRequested && !isAssigned && (
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            ⏳ Request Sent — Awaiting Response
          </div>
        )}

        {isCancelled && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
            Cancelled
          </div>
        )}

        {!isRequested && !isAssigned && !isCompleted && !isCancelled && (
          <button
            onClick={(e) => { e.stopPropagation(); open(); }}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-[13px] font-semibold text-white transition hover:bg-blue-700"
          >
            Find Volunteers →
          </button>
        )}

        {isCompleted && (
          <button
            onClick={(e) => { e.stopPropagation(); open(); }}
            className="w-full rounded-lg bg-violet-600 py-2.5 text-[13px] font-semibold text-white transition hover:bg-violet-700"
          >
            View Details →
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;

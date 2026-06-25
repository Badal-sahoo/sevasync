import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addTaskUpdate, getTaskUpdates, getTaskById } from "../../api/tasks";
import VolunteerLayout from "../../shared/VolunteerLayout";
import usePolling from "../../shared/usePolling";

const VolunteerTaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [message, setMessage] = useState("");

  const fetchTask = async () => {
    try {
      setTask(await getTaskById(taskId));
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

  usePolling(async () => {
    await fetchTask();
    await fetchUpdates();
  }, 8000, [taskId]);

  const handleAddUpdate = async () => {
    if (!message.trim()) return;
    try {
      await addTaskUpdate(taskId, message);
      setMessage("");
      fetchUpdates();
    } catch (err) {
      alert("Failed to add update");
    }
  };

  const closed = task && (task.status === "completed" || task.status === "cancelled");

  return (
    <VolunteerLayout
      title="Task Progress"
      subtitle={task ? task.need_type?.toUpperCase() : ""}
      onBack={() => navigate(-1)}
    >
      <div className="flex flex-col gap-5">
        {task && (
          <div className="rounded-2xl border border-[#e2eaf5] bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-extrabold uppercase tracking-wide text-[#0a1f5c]">
              {task.need_type?.toUpperCase()}
            </h2>
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p><strong className="text-[#0a1f5c]">📍 Location:</strong> {task.location_name || task.location}</p>
              <p><strong className="text-[#0a1f5c]">⚡ Urgency:</strong> {task.urgency}</p>
              <p><strong className="text-[#0a1f5c]">👥 People:</strong> {task.total_people}</p>
              <p><strong className="text-[#0a1f5c]">Status:</strong> <span className="capitalize">{task.status}</span></p>
            </div>
          </div>
        )}

        {/* Add update — only while the task is still active */}
        {closed ? (
          <div className="rounded-2xl border border-[#e2eaf5] bg-slate-50 p-5">
            <p className="m-0 font-semibold text-slate-500">
              {task.status === "completed"
                ? "✅ This task is completed — updates are closed."
                : "🚫 This task was cancelled — updates are closed."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#e2eaf5] bg-white p-6 shadow-sm">
            <textarea
              placeholder="Write your update..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] w-full resize-y rounded-xl border-[1.5px] border-[#e2eaf5] bg-slate-50 px-3.5 py-2.5 text-sm text-[#0a1f5c] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-[3px] focus:ring-blue-500/15"
            />
            <button
              onClick={handleAddUpdate}
              className="self-start rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition hover:-translate-y-px hover:bg-blue-700"
            >
              Submit Update
            </button>
          </div>
        )}

        {/* Updates list */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Volunteer Updates</h3>
          {updates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dce6f5] bg-white px-6 py-8 text-center text-sm text-slate-400">
              No updates yet
            </div>
          ) : (
            updates.map((u, i) => (
              <div key={i} className="rounded-2xl border border-[#e2eaf5] bg-white p-4 shadow-sm">
                <p className="m-0 text-sm font-bold text-[#0a1f5c]">{u.name}</p>
                <p className="my-1 text-sm text-slate-600">{u.message}</p>
                <span className="text-xs text-slate-400">{new Date(u.time).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </VolunteerLayout>
  );
};

export default VolunteerTaskDetail;

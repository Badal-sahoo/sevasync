import React, { useState } from "react";
import { getNgoDashboard } from "../../api/ngo";
import usePolling from "../../shared/usePolling";

const CARDS = [
  { key: "total_requests", title: "Total Requests", icon: "📋", value: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100" },
  { key: "total_tasks", title: "Total Tasks", icon: "📌", value: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", iconBg: "bg-violet-100" },
  { key: "completed_tasks", title: "Completed", icon: "✅", value: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100" },
  { key: "active_volunteers", title: "Active Volunteers", icon: "🙋", value: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", iconBg: "bg-amber-100" },
  { key: "urgent_tasks", title: "Urgent Tasks", icon: "🚨", value: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", iconBg: "bg-rose-100" },
];

const StatsCards = ({ refreshKey = 0 }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  usePolling(async () => {
    try {
      setStats(await getNgoDashboard());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, 10000, [refreshKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {CARDS.map((c) => (
          <div key={c.key} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!stats) return <p className="text-sm text-rose-500">No data available</p>;

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
      {CARDS.map((c) => (
        <div
          key={c.key}
          className={`flex flex-col gap-3 rounded-2xl border ${c.border} ${c.bg} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md`}
        >
          <div className="flex items-center justify-between">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${c.iconBg}`}>{c.icon}</span>
          </div>
          <div className={`text-4xl font-extrabold leading-none ${c.value}`}>{stats[c.key] ?? 0}</div>
          <div className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">{c.title}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;

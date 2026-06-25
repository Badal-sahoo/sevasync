import { useEffect, useState } from "react";
import { getVolunteerDashboard, getVolunteerPoints } from "../../api/volunteers";

const statCards = [
  { key: "assigned", title: "Total Assigned", icon: "📋", valueKey: "totalAssigned", accent: "#2563eb", bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100 text-blue-600" },
  { key: "completed", title: "Completed Tasks", icon: "✅", valueKey: "completedTasks", accent: "#059669", bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600" },
  { key: "points", title: "Total Points", icon: "⭐", valueKey: "totalPoints", accent: "#7c3aed", bg: "bg-violet-50", border: "border-violet-200", iconBg: "bg-violet-100 text-violet-600" },
];

const VolunteerStats = ({ volunteerId, refreshKey = 0 }) => {
  const [stats, setStats] = useState({ totalAssigned: 0, completedTasks: 0, totalPoints: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [dashboardData, pointsData] = await Promise.all([
          getVolunteerDashboard(),
          getVolunteerPoints(),
        ]);
        if (!isActive) return;
        setStats({
          totalAssigned: dashboardData?.total_assigned ?? 0,
          completedTasks: dashboardData?.completed_tasks ?? 0,
          totalPoints: pointsData?.total_points ?? 0,
        });
      } catch (error) {
        console.error("Error fetching volunteer stats:", error);
        if (isActive) setStats({ totalAssigned: 0, completedTasks: 0, totalPoints: 0 });
      } finally {
        if (isActive) setLoading(false);
      }
    };
    fetchStats();
    return () => { isActive = false; };
  }, [refreshKey, volunteerId]);

  return (
    <section className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Overview</p>
        <h2 className="text-2xl font-extrabold text-[#0a1f5c]">Volunteer Snapshot</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <article
            key={card.key}
            className={`rounded-2xl border ${card.border} ${card.bg} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md`}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-base ${card.iconBg}`}>
                {card.icon}
              </span>
              <span className="text-sm font-bold uppercase tracking-wide text-slate-500">{card.title}</span>
            </div>
            {loading ? (
              <span className="block h-9 w-24 animate-pulse rounded-full bg-slate-200" />
            ) : (
              <strong className="block text-3xl font-extrabold leading-none" style={{ color: card.accent }}>
                {stats[card.valueKey]}
              </strong>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default VolunteerStats;

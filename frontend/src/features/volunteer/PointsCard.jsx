import { useEffect, useState } from "react";
import { getVolunteerPoints } from "../../api/volunteers";

const Card = ({ children }) => (
  <div className="flex flex-col gap-[18px] rounded-2xl border border-[#e2eaf5] bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
    {children}
  </div>
);

const PointsCard = ({ refreshKey = 0 }) => {
  const [data, setData] = useState({ total_points: 0, tasks_completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchPoints = async () => {
      setLoading(true);
      try {
        const res = await getVolunteerPoints();
        if (!active) return;
        setData({ total_points: res?.total_points ?? 0, tasks_completed: res?.tasks_completed ?? 0 });
      } catch (err) {
        console.error("Points error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPoints();
    return () => { active = false; };
  }, [refreshKey]);

  if (loading) {
    return (
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Rewards</p>
        <h3 className="text-xl font-extrabold text-[#0a1f5c]">Your Points</h3>
        <p className="text-sm text-slate-500">Loading rewards...</p>
      </Card>
    );
  }

  const progress = Math.min((data.total_points / 1000) * 100, 100);

  return (
    <Card>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Rewards</p>
        <h3 className="text-xl font-extrabold text-[#0a1f5c]">Your Points</h3>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-[18px]">
        <span className="mb-2 block text-[13px] font-semibold text-blue-600">Total Points</span>
        <strong className="text-4xl font-extrabold leading-none text-blue-700">{data.total_points}</strong>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
          <span>Next Milestone</span>
          <span>{data.total_points}/1000</span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-[width] duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
          <span>Tasks Completed</span>
          <strong className="text-[#0a1f5c]">{data.tasks_completed}</strong>
        </div>
      </div>
    </Card>
  );
};

export default PointsCard;

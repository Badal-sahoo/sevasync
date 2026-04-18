import { useEffect, useState } from "react";
import { getVolunteerPoints } from "../services/api";
import "./PointsCard.css";

const PointsCard = ({ refreshKey = 0 }) => {
  const [data, setData] = useState({
    total_points: 0,
    tasks_completed: 0,
    badges: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchPoints = async () => {
      setLoading(true);

      try {
        const res = await getVolunteerPoints();

        if (!active) return;

        setData({
          total_points: res?.total_points ?? 0,
          tasks_completed: res?.tasks_completed ?? 0,
          badges: res?.badges ?? [],
        });
      } catch (err) {
        console.error("Points error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPoints();
    return () => (active = false);
  }, [refreshKey]);

  // 🔄 Loading UI
  if (loading) {
    return (
      <div className="points-card">
        <p className="points-card__eyebrow">Rewards</p>
        <h3 className="points-card__title">Your Points</h3>
        <p className="points-card__placeholder">Loading rewards...</p>
      </div>
    );
  }

  const progress = Math.min((data.total_points / 1000) * 100, 100); 
  // 👉 1000 = next milestone (can change later)

  return (
    <div className="points-card">
      {/* 🔹 Header */}
      <div>
        <p className="points-card__eyebrow">Rewards</p>
        <h3 className="points-card__title">Your Points</h3>
      </div>

      {/* 🔹 Score */}
      <div className="points-card__score">
        <span className="points-card__score-label">Total Points</span>
        <strong className="points-card__score-value">
          {data.total_points}
        </strong>
      </div>

      {/* 🔹 Progress */}
      <div className="points-card__progress-block">
        <div className="points-card__progress-header">
          <span>Next Milestone</span>
          <span>{data.total_points}/1000</span>
        </div>

        <div className="points-card__progress-track">
          <div
            className="points-card__progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="points-card__summary">
          <span>Tasks Completed</span>
          <strong>{data.tasks_completed}</strong>
        </div>
      </div>

      {/* 🔹 Badges */}
      <div className="points-card__badges">
        <h4 className="points-card__badges-title">Badges Earned</h4>

        {data.badges.length === 0 ? (
          <p className="points-card__placeholder">
            No badges yet — start helping to earn rewards 🚀
          </p>
        ) : (
          <ul className="points-card__badge-list">
            {data.badges.map((b) => (
              <li key={b} className="points-card__badge">
                🏅 {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PointsCard;
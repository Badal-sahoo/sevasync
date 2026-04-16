import { useEffect, useState } from "react";
import { getVolunteerPoints } from "../services/api";

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

  return (
    <div>
      <h2>Points</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p>Total Points: {data.total_points}</p>
          <p>Tasks Completed: {data.tasks_completed}</p>

          <h4>Badges:</h4>
          {data.badges.length === 0 ? (
            <p>No badges</p>
          ) : (
            <ul>
              {data.badges.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default PointsCard;
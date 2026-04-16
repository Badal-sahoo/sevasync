import { useEffect, useState } from "react";
import { getVolunteerDashboard, getVolunteerPoints } from "../services/api";
import "./VolunteerStats.css";

const statCards = [
  {
    key: "assigned",
    title: "Total Assigned",
    icon: "A",
    valueKey: "totalAssigned",
  },
  {
    key: "completed",
    title: "Completed Tasks",
    icon: "C",
    valueKey: "completedTasks",
  },
  {
    key: "points",
    title: "Total Points",
    icon: "P",
    valueKey: "totalPoints",
  },
  {
    key: "badges",
    title: "Badge Count",
    icon: "B",
    valueKey: "badgeCount",
  },
];

const VolunteerStats = ({ volunteerId, refreshKey = 0 }) => {
  const [stats, setStats] = useState({
    totalAssigned: 0,
    completedTasks: 0,
    totalPoints: 0,
    badgeCount: 0,
  });
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

        if (!isActive) {
          return;
        }

        setStats({
          totalAssigned: dashboardData?.total_assigned ?? 0,
          completedTasks: dashboardData?.completed_tasks ?? 0,
          totalPoints: pointsData?.total_points ?? 0,
          badgeCount: Array.isArray(pointsData?.badges) ? pointsData.badges.length : 0,
        });
      } catch (error) {
        console.error("Error fetching volunteer stats:", error);

        if (isActive) {
          setStats({
            totalAssigned: 0,
            completedTasks: 0,
            totalPoints: 0,
            badgeCount: 0,
          });
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isActive = false;
    };
  }, [refreshKey, volunteerId]);

  return (
    <section className="volunteer-stats">
      <div className="volunteer-stats__header">
        <div>
          <p className="volunteer-stats__eyebrow">Overview</p>
          <h2 className="volunteer-stats__heading">Volunteer Snapshot</h2>
        </div>
      </div>

      <div className="volunteer-stats__grid">
        {statCards.map((card) => (
          <article className={`volunteer-stats__card volunteer-stats__card--${card.key}`} key={card.key}>
            <div className="volunteer-stats__card-top">
              <span className={`volunteer-stats__icon volunteer-stats__icon--${card.key}`}>{card.icon}</span>
              <span className="volunteer-stats__title">{card.title}</span>
            </div>
            <div className="volunteer-stats__card-bottom">
              {loading ? (
                <span className="volunteer-stats__skeleton" />
              ) : (
                <strong className="volunteer-stats__value">{stats[card.valueKey]}</strong>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default VolunteerStats;

import { useEffect, useState } from "react";
import { getVolunteerPerformance } from "../services/api";

const PerformanceChart = ({ refreshKey = 0 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchPerformance = async () => {
      setLoading(true);

      try {
        const res = await getVolunteerPerformance();

        if (!active) return;

        setData(res);
      } catch (err) {
        console.error("Performance error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPerformance();

    return () => (active = false);
  }, [refreshKey]);

  if (loading) return <p>Loading performance...</p>;
  if (!data) return <p>No data</p>;

  return (
    <div>
      <h2>Performance</h2>

      <p>Total Completed: {data.total_completed}</p>
      <p>Efficiency: {data.efficiency_percent}%</p>

      <h4>Urgency Breakdown:</h4>
      <ul>
        <li>High: {data.urgency_breakdown?.high}</li>
        <li>Medium: {data.urgency_breakdown?.medium}</li>
        <li>Low: {data.urgency_breakdown?.low}</li>
      </ul>
    </div>
  );
};

export default PerformanceChart;
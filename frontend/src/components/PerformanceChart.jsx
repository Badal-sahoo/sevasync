import { useEffect, useState } from "react";
import { getVolunteerPerformance } from "../services/api";
import "./PerformanceChart.css";

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

  // 🔄 Loading UI (improved)
  if (loading) {
    return (
      <div className="performance-chart">
        <p className="performance-chart__eyebrow">Performance</p>
        <h3 className="performance-chart__title">Your Impact</h3>
        <div className="performance-chart__state">Loading performance data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="performance-chart">
        <p className="performance-chart__eyebrow">Performance</p>
        <h3 className="performance-chart__title">Your Impact</h3>
        <div className="performance-chart__state">No data available</div>
      </div>
    );
  }

  const total = data.total_completed || 0;
  const efficiency = data.efficiency_percent || 0;

  const breakdown = data.urgency_breakdown || {
    high: 0,
    medium: 0,
    low: 0,
  };

  const totalBreakdown =
    breakdown.high + breakdown.medium + breakdown.low || 1;

  return (
    <div className="performance-chart">
      {/* 🔹 Header */}
      <div>
        <p className="performance-chart__eyebrow">Performance</p>
        <h3 className="performance-chart__title">Your Impact</h3>
      </div>

      {/* 🔹 Stats */}
      <div className="performance-chart__stats">
        <div className="performance-chart__stat">
          <span>Total Completed</span>
          <strong>{total}</strong>
        </div>

        <div className="performance-chart__stat">
          <span>Efficiency</span>
          <strong>{efficiency}%</strong>
        </div>
      </div>

      {/* 🔹 Bars */}
      <div className="performance-chart__bars">
        {/* HIGH */}
        <div className="performance-chart__bar-row">
          <div className="performance-chart__bar-label">
            <span>High Priority</span>
            <span>{breakdown.high}</span>
          </div>
          <div className="performance-chart__bar-track">
            <div
              className="performance-chart__bar-fill performance-chart__bar-fill--high"
              style={{
                width: `${(breakdown.high / totalBreakdown) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* MEDIUM */}
        <div className="performance-chart__bar-row">
          <div className="performance-chart__bar-label">
            <span>Medium Priority</span>
            <span>{breakdown.medium}</span>
          </div>
          <div className="performance-chart__bar-track">
            <div
              className="performance-chart__bar-fill performance-chart__bar-fill--medium"
              style={{
                width: `${(breakdown.medium / totalBreakdown) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* LOW */}
        <div className="performance-chart__bar-row">
          <div className="performance-chart__bar-label">
            <span>Low Priority</span>
            <span>{breakdown.low}</span>
          </div>
          <div className="performance-chart__bar-track">
            <div
              className="performance-chart__bar-fill performance-chart__bar-fill--low"
              style={{
                width: `${(breakdown.low / totalBreakdown) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
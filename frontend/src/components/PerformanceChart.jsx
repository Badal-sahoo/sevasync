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

  if (loading) {
    return (
      <div className="performance-chart performance-chart--skeleton">
        <div className="performance-chart__header">
          <p className="performance-chart__eyebrow">Performance</p>
          <h3 className="performance-chart__title">Your Impact</h3>
        </div>
        <div className="performance-chart__state">
          <div className="spinner"></div>
          <span>Loading your metrics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="performance-chart">
        <div className="performance-chart__header">
          <p className="performance-chart__eyebrow">Performance</p>
          <h3 className="performance-chart__title">Your Impact</h3>
        </div>
        <div className="performance-chart__state">No data available</div>
      </div>
    );
  }

  const total = data.total_completed || 0;
  const efficiency = data.efficiency_percent || 0;
  const breakdown = data.urgency_breakdown || { high: 0, medium: 0, low: 0 };
  const totalBreakdown = breakdown.high + breakdown.medium + breakdown.low || 1;

  return (
    <div className="performance-chart performance-chart--loaded">
      <div className="performance-chart__header">
        <div>
          <p className="performance-chart__eyebrow">Overview</p>
          <h3 className="performance-chart__title">Your Impact</h3>
        </div>
      </div>

      <div className="performance-chart__stats">
        <div className="performance-chart__stat">
          <div className="performance-chart__stat-header">
            <svg className="stat-icon stat-icon--blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Completed</span>
          </div>
          <strong>{total}</strong>
        </div>

        <div className="performance-chart__stat">
          <div className="performance-chart__stat-header">
            <svg className="stat-icon stat-icon--purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Efficiency</span>
          </div>
          <strong>{efficiency}%</strong>
        </div>
      </div>

      <div className="performance-chart__bars">
        <div className="performance-chart__bar-row">
          <div className="performance-chart__bar-label">
            <span className="label-text">
              <span className="dot dot--high"></span> High Priority
            </span>
            <span className="label-value">{breakdown.high}</span>
          </div>
          <div className="performance-chart__bar-track">
            <div
              className="performance-chart__bar-fill performance-chart__bar-fill--high"
              style={{ width: `${(breakdown.high / totalBreakdown) * 100}%` }}
            />
          </div>
        </div>

        <div className="performance-chart__bar-row">
          <div className="performance-chart__bar-label">
            <span className="label-text">
              <span className="dot dot--medium"></span> Medium Priority
            </span>
            <span className="label-value">{breakdown.medium}</span>
          </div>
          <div className="performance-chart__bar-track">
            <div
              className="performance-chart__bar-fill performance-chart__bar-fill--medium"
              style={{ width: `${(breakdown.medium / totalBreakdown) * 100}%` }}
            />
          </div>
        </div>

        <div className="performance-chart__bar-row">
          <div className="performance-chart__bar-label">
            <span className="label-text">
              <span className="dot dot--low"></span> Low Priority
            </span>
            <span className="label-value">{breakdown.low}</span>
          </div>
          <div className="performance-chart__bar-track">
            <div
              className="performance-chart__bar-fill performance-chart__bar-fill--low"
              style={{ width: `${(breakdown.low / totalBreakdown) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
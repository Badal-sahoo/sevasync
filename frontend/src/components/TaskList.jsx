import React, { useEffect, useState } from "react";
import { getNgoRequests } from "../services/ngoApi";
import TaskCard from "./TaskCard";
import { useNavigate } from "react-router-dom";

const TaskList = ({ ngoId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 6;

  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getNgoRequests(ngoId);

      // 🔥 SHOW ALL TASKS (UI handles state)
      setTasks(data);
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [ngoId]);

  const indexOfLast = currentPage * tasksPerPage;
  const indexOfFirst = indexOfLast - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  const handleFindVolunteers = (taskId) => {
    navigate(`/task/${taskId}`);
  };

  if (loading) return <p>Loading tasks...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>All Tasks</h2>

      <div style={styles.grid}>
        {currentTasks.length === 0 ? (
          <p>No tasks</p>
        ) : (
          currentTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onFindVolunteers={handleFindVolunteers}
            />
          ))
        )}
      </div>

      {/* PAGINATION */}
      <div style={styles.pagination}>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            style={{
              ...styles.pageBtn,
              background: currentPage === i + 1 ? "#0ea5e9" : "#334155",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
  },
  pagination: {
    marginTop: "20px",
    display: "flex",
    gap: "10px",
    justifyContent: "center",
  },
  pageBtn: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
  },
};

export default TaskList;
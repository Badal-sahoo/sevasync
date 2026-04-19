import React, { useEffect, useState } from "react";
import { getNgoRequests } from "../services/api";
import TaskCard from "./TaskCard";
import { useNavigate } from "react-router-dom";

const TaskList = ({ ngoId, filter }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 6;

  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getNgoRequests(ngoId);

      const filteredTasks = data.filter((task) => {
        if (filter === "pending") return task.status === "pending";
        if (filter === "assigned") return task.status === "assigned";
        if (filter === "completed") return task.status === "completed";
        return true;
      });

      setTasks(filteredTasks);
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [ngoId, filter]);

  const indexOfLast = currentPage * tasksPerPage;
  const indexOfFirst = indexOfLast - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  const handleFindVolunteers = (taskId) => {
    navigate(`/task/${taskId}`);
  };

  const filterLabel = {
    pending: { label: "Pending Tasks", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    assigned: { label: "Assigned Tasks", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    completed: { label: "Completed Tasks", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  };
  const current = filterLabel[filter] || { label: "All Tasks", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };

  if (loading) {
    return (
      <div style={styles.skeletonGrid}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <h2 style={styles.title}>{current.label}</h2>
          <span
            style={{
              ...styles.countBadge,
              color: current.color,
              background: current.bg,
              border: `1px solid ${current.border}`,
            }}
          >
            {tasks.length} tasks
          </span>
        </div>
      </div>

      {/* GRID */}
      <div style={styles.grid}>
        {currentTasks.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>📭</div>
            <p style={styles.emptyText}>No tasks found</p>
            <p style={styles.emptySubText}>Nothing here yet for this category</p>
          </div>
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
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{ ...styles.pageNavBtn, opacity: currentPage === 1 ? 0.4 : 1 }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            ← Prev
          </button>

          <div style={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                style={{
                  ...styles.pageBtn,
                  ...(currentPage === i + 1 ? styles.pageBtnActive : {}),
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            style={{ ...styles.pageNavBtn, opacity: currentPage === totalPages ? 0.4 : 1 }}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0a1f5c",
    margin: 0,
  },

  countBadge: {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "18px",
  },

  skeletonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "18px",
  },

  skeletonCard: {
    height: "200px",
    background: "linear-gradient(90deg, #e8eef8, #f4f8ff, #e8eef8)",
    borderRadius: "14px",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
  },

  emptyBox: {
    gridColumn: "1 / -1",
    background: "#ffffff",
    border: "2px dashed #dce6f5",
    borderRadius: "14px",
    padding: "60px 40px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },

  emptyText: {
    color: "#0a1f5c",
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
  },

  emptySubText: {
    color: "#8fa3c0",
    fontSize: "13px",
    marginTop: "6px",
  },

  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    paddingTop: "8px",
  },

  pageNavBtn: {
    padding: "8px 16px",
    background: "#ffffff",
    border: "1.5px solid #dce6f5",
    borderRadius: "8px",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s",
  },

  pageNumbers: {
    display: "flex",
    gap: "6px",
  },

  pageBtn: {
    width: "36px",
    height: "36px",
    background: "#ffffff",
    border: "1.5px solid #dce6f5",
    borderRadius: "8px",
    color: "#5a7299",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s",
  },

  pageBtnActive: {
    background: "#2563eb",
    border: "1.5px solid #2563eb",
    color: "#ffffff",
  },
};

export default TaskList;

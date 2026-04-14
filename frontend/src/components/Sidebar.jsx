import React from "react";

const Sidebar = ({ active, setActive }) => {
  const menu = [
    "Home",
    "Upload",
    "TaskList",
    "Assigned",
    "Completed",
  ];

  return (
    <div style={styles.sidebar}>
      <h2 style={{ marginBottom: "30px" }}>NGO Panel</h2>

      {menu.map((item) => (
        <div
          key={item}
          onClick={() => setActive(item)}
          style={{
            ...styles.item,
            background: active === item ? "#0ea5e9" : "transparent",
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

const styles = {
  sidebar: {
    width: "220px",
    height: "100vh",
    background: "#1e293b",
    color: "white",
    padding: "20px",
    position: "fixed",
    left: 0,
    top: 0,
  },
  item: {
    padding: "12px",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "10px",
  },
};

export default Sidebar;
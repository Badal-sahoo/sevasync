import React from "react";

const menuItems = [
  { name: "Home", icon: "⊞" },
  { name: "Upload", icon: "↑" },
  { name: "TaskList", icon: "☰" },
  { name: "Assigned", icon: "✓" },
  { name: "Completed", icon: "◎" },
];

const Sidebar = ({ active, setActive }) => {
  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoWrap}>
        <div style={styles.logoIcon}>N</div>
        <div>
          <div style={styles.logoText}>NGO Panel</div>
          <div style={styles.logoSub}>Relief Operations</div>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Nav */}
      <nav style={styles.nav}>
        {menuItems.map(({ name, icon }) => {
          const isActive = active === name;
          return (
            <div
              key={name}
              onClick={() => setActive(name)}
              style={{
                ...styles.item,
                ...(isActive ? styles.itemActive : {}),
              }}
            >
              <span style={{ ...styles.icon, ...(isActive ? styles.iconActive : {}) }}>
                {icon}
              </span>
              <span>{name}</span>
              {isActive && <div style={styles.activePill} />}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.orgBadge}>
          <div style={styles.orgDot} />
          <span style={styles.orgText}>Organization Active</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: "250px",
    height: "100vh",
    background: "linear-gradient(175deg, #0a1f5c 0%, #1a3a8f 60%, #1e4db7 100%)",
    color: "white",
    padding: "0",
    position: "fixed",
    left: 0,
    top: 0,
    display: "flex",
    flexDirection: "column",
    boxShadow: "4px 0 24px rgba(10,31,92,0.18)",
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "28px 22px 20px",
  },

  logoIcon: {
    width: "38px",
    height: "38px",
    background: "rgba(255,255,255,0.15)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "800",
    border: "1.5px solid rgba(255,255,255,0.25)",
    backdropFilter: "blur(10px)",
  },

  logoText: {
    fontSize: "16px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },

  logoSub: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.5)",
    marginTop: "1px",
  },

  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.1)",
    margin: "0 22px 16px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "0 14px",
    flex: 1,
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "rgba(255,255,255,0.65)",
    transition: "all 0.2s ease",
    position: "relative",
  },

  itemActive: {
    background: "rgba(255,255,255,0.15)",
    color: "#ffffff",
    backdropFilter: "blur(8px)",
  },

  icon: {
    fontSize: "15px",
    opacity: 0.7,
    width: "20px",
    textAlign: "center",
  },

  iconActive: {
    opacity: 1,
  },

  activePill: {
    position: "absolute",
    right: "14px",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#60a5fa",
  },

  footer: {
    padding: "18px 22px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },

  orgBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  orgDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 6px #4ade80",
  },

  orgText: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.5)",
  },
};

export default Sidebar;

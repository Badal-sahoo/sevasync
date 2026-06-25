import { useNavigate } from "react-router-dom";
import { logoutUser } from "../auth/firebase";

/**
 * Volunteer top panel (header) for pages outside the dashboard, e.g. the task
 * detail page — keeps the same chrome so the page doesn't feel detached.
 */
const VolunteerLayout = ({ title = "Task Details", subtitle, onBack, children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem("token");
    try {
      await logoutUser();
    } finally {
      navigate("/");
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.left}>
          {onBack && <button onClick={onBack} style={styles.backBtn}>← Back</button>}
          <div>
            <p style={styles.eyebrow}>SevaSync</p>
            <h1 style={styles.title}>{title}</h1>
            {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        <button style={styles.logout} onClick={handleLogout}>Logout</button>
      </header>

      <div style={styles.content}>{children}</div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#f4f7fb" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 28px", background: "#ffffff", borderBottom: "1px solid #e2e8f0",
    position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 10px rgba(15,23,42,0.05)",
  },
  left: { display: "flex", alignItems: "center", gap: "14px" },
  backBtn: {
    padding: "8px 14px", background: "#eff6ff", border: "1px solid #bfdbfe",
    borderRadius: "8px", color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: "13px",
  },
  eyebrow: { margin: 0, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#3b82f6" },
  title: { margin: "2px 0 0", fontSize: "20px", fontWeight: 800, color: "#0f172a" },
  subtitle: { margin: "2px 0 0", fontSize: "13px", color: "#64748b" },
  logout: {
    padding: "8px 18px", background: "transparent", border: "1.5px solid #ef4444",
    borderRadius: "8px", color: "#ef4444", cursor: "pointer", fontWeight: 600, fontSize: "13px",
  },
  content: { padding: "24px 28px", maxWidth: "900px", margin: "0 auto" },
};

export default VolunteerLayout;

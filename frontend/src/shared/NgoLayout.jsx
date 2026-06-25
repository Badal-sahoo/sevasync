import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../auth/firebase";
import { getNgoDashboard } from "../api/ngo";
import Sidebar from "./Sidebar";

/**
 * NGO chrome (fixed sidebar + sticky top panel) for pages outside the dashboard,
 * e.g. Task Detail. Sidebar items navigate back to the dashboard on that tab.
 */
const NgoLayout = ({ active = "TaskList", title, subtitle, onBack, children }) => {
  const navigate = useNavigate();
  const [ngoName, setNgoName] = useState("");

  useEffect(() => {
    getNgoDashboard()
      .then((d) => setNgoName(d?.name || ""))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch {
      alert("Failed to log out");
    }
  };

  return (
    <div style={styles.wrapper}>
      <Sidebar
        active={active}
        name={ngoName}
        setActive={(tab) => navigate("/ngo-dashboard", { state: { tab } })}
      />

      <div style={styles.main}>
        <div style={styles.topbar}>
          <div style={styles.left}>
            {onBack && (
              <button onClick={onBack} style={styles.backBtn}>← Back</button>
            )}
            <div>
              <h1 style={styles.heading}>{title}</h1>
              {subtitle && <p style={styles.subheading}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
        </div>

        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: { display: "flex", background: "#f0f5ff", minHeight: "100vh" },
  main: { marginLeft: "250px", flex: 1, display: "flex", flexDirection: "column" },
  topbar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "22px 32px", background: "#ffffff", borderBottom: "1px solid #e2eaf5",
    position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 10px rgba(10,31,92,0.05)",
  },
  left: { display: "flex", alignItems: "center", gap: "14px" },
  backBtn: {
    padding: "8px 14px", background: "#f0f5ff", border: "1px solid #dce6f5",
    borderRadius: "8px", color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: "13px",
  },
  heading: { fontSize: "20px", fontWeight: 700, color: "#0a1f5c", margin: 0 },
  subheading: { fontSize: "13px", color: "#8fa3c0", margin: "3px 0 0" },
  logoutBtn: {
    padding: "8px 18px", background: "transparent", border: "1.5px solid #ef4444",
    borderRadius: "8px", color: "#ef4444", cursor: "pointer", fontWeight: 600, fontSize: "13px",
  },
  content: { padding: "28px 32px", flex: 1 },
};

export default NgoLayout;

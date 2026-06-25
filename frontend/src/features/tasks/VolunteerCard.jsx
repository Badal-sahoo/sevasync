import React from 'react';

const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];

const VolunteerCard = ({ volunteer, index, onAssign, state = "send" }) => {
    const disabled = state !== "send";
    const label =
        state === "sending" ? "Sending..."
        : state === "requested" ? "Requested ✓"
        : state === "accepted" ? "Accepted ✓"
        : "Send Request";

    return (
        <div style={styles.card}>
            <div style={styles.top}>
                <div style={{ ...styles.avatar, background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}>
                    {volunteer.name.charAt(0).toUpperCase()}
                </div>
                <div style={styles.info}>
                    <h4 style={styles.name}>{volunteer.name}</h4>
                    <div style={styles.scoreRow}>
                        <span style={styles.scoreBadge}>⭐ {volunteer.score}</span>
                    </div>
                </div>
            </div>

            <div style={styles.skillsWrap}>
                {volunteer.skills.map((skill, i) => (
                    <span key={i} style={styles.skillChip}>{skill}</span>
                ))}
            </div>

            <button
                style={{ ...styles.assignBtn, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
                disabled={disabled}
                onClick={() => onAssign(volunteer.volunteer_id)}
            >
                {label}
            </button>
        </div>
    );
};

const styles = {
    card: {
        background: "#ffffff",
        padding: "16px",
        borderRadius: "12px",
        border: "1px solid #e2eaf5",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 2px 8px rgba(10,31,92,0.04)",
    },
    top: { display: "flex", gap: "12px", alignItems: "center" },
    avatar: {
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        fontWeight: "700",
        flexShrink: 0,
    },
    info: { flex: 1 },
    name: { margin: "0 0 3px", fontSize: "14px", fontWeight: "600", color: "#0a1f5c" },
    scoreRow: { display: "flex", gap: "6px" },
    scoreBadge: {
        fontSize: "11px",
        fontWeight: "600",
        color: "#d97706",
        background: "#fffbeb",
        padding: "2px 8px",
        borderRadius: "6px",
        border: "1px solid #fde68a",
    },
    skillsWrap: { display: "flex", flexWrap: "wrap", gap: "5px" },
    skillChip: {
        padding: "2px 8px",
        background: "#eff6ff",
        color: "#2563eb",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: "500",
        border: "1px solid #bfdbfe",
    },
    assignBtn: {
        padding: "8px",
        background: "#2563eb",
        border: "none",
        borderRadius: "8px",
        color: "white",
        fontWeight: "600",
        fontSize: "13px",
        width: "100%",
        transition: "background 0.2s",
    },
};

export default VolunteerCard;

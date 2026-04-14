import React, { useEffect, useState } from "react";
import { matchVolunteers, assignTask } from "../services/ngoApi";

const MatchModal = ({ taskId, onClose, onAssigned }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await matchVolunteers(taskId);
                setData(res);
            } catch (err) {
                console.error("Error fetching matches:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [taskId]);

    const [assigningId, setAssigningId] = useState(null);

    const handleAssign = async (volunteerId) => {
        try {
            setAssigningId(volunteerId);

            await assignTask(taskId, volunteerId);

            alert("Task Assigned ✅");

            onAssigned();   // refresh task list
            onClose();      // close modal
        } catch (err) {
            console.error(err);
            alert("Assignment failed ❌");
        } finally {
            setAssigningId(null);
        }
    };

    if (!taskId) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h2>Recommended Volunteers</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        <p><strong>Task:</strong> {data.task.type} ({data.task.urgency})</p>

                        {data.recommended.map((v) => (
                            <div key={v.volunteer_id} style={styles.card}>
                                <p><strong>{v.name}</strong></p>
                                <p>Skills: {v.skills.join(", ")}</p>
                                <p>Score: {v.score}</p>

                                <button
                                    style={{
                                        ...styles.button,
                                        opacity: assigningId === v.volunteer_id ? 0.6 : 1,
                                        cursor: assigningId === v.volunteer_id ? "not-allowed" : "pointer",
                                    }}
                                    disabled={assigningId === v.volunteer_id}
                                    onClick={() => handleAssign(v.volunteer_id)}
                                >
                                    {assigningId === v.volunteer_id ? "Assigning..." : "Assign"}
                                </button>
                            </div>
                        ))}
                    </>
                )}

                <button style={styles.closeBtn} onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        width: "400px",
    },
    card: {
        border: "1px solid #ddd",
        padding: "10px",
        marginTop: "10px",
        borderRadius: "6px",
    },
    button: {
        marginTop: "5px",
        padding: "6px 10px",
        background: "#0ea5e9",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
    closeBtn: {
        marginTop: "15px",
        background: "#dc3545",
        color: "white",
        border: "none",
        padding: "8px",
        borderRadius: "5px",
    },
};

export default MatchModal;
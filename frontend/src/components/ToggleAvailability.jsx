import { useState } from "react";
import { updateAvailability } from "../services/api";
import "./ToggleAvailability.css";

const ToggleAvailability = ({ initialAvailability = true }) => {
  const [available, setAvailable] = useState(initialAvailability);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const newValue = !available;
    setLoading(true);

    try {
      await updateAvailability(newValue);
      setAvailable(newValue);
    } catch (error) {
      console.error("Error updating availability:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="availability-toggle">
      {/* 🔹 Label */}
      <div className="availability-text">
        <span className="availability-status">
          {available ? "Available" : "Unavailable"}
        </span>
        <span className="availability-sub">
          {available ? "You can receive tasks" : "You won’t get new tasks"}
        </span>
      </div>

      {/* 🔹 SWITCH */}
      <button
        className={`switch ${available ? "on" : "off"}`}
        onClick={handleToggle}
        disabled={loading}
      >
        <span className="slider" />
      </button>
    </div>
  );
};

export default ToggleAvailability;
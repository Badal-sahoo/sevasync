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
      <span className="availability-label">
        {available ? "Available 🟢" : "Unavailable 🔴"}
      </span>

      <button
        className={`toggle-btn ${available ? "on" : "off"}`}
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? "Updating..." : available ? "Turn OFF" : "Turn ON"}
      </button>
    </div>
  );
};

export default ToggleAvailability;
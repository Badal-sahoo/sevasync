import { useState } from "react";
import { updateAvailability } from "../../api/volunteers";

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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#e2eaf5] bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold text-[#0a1f5c]">
          {available ? "Available" : "Unavailable"}
        </span>
        <span className="text-xs text-slate-500">
          {available ? "You can receive tasks" : "You won't get new tasks"}
        </span>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        aria-pressed={available}
        className={`relative h-[26px] w-[50px] flex-shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
          available ? "bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.35)]" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
            available ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleAvailability;

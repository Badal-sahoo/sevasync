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
    <div className="min-h-screen bg-[#f0f5ff] font-poppins">
      <header className="sticky top-0 z-[100] flex items-center justify-between border-b border-[#e2eaf5] bg-white px-7 py-5 shadow-[0_1px_10px_rgba(10,31,92,0.05)]">
        <div className="flex items-center gap-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-[13px] font-semibold text-blue-600 transition hover:bg-blue-100"
            >
              ← Back
            </button>
          )}
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-blue-600">SevaSync</p>
            <h1 className="text-xl font-extrabold text-[#0a1f5c]">{title}</h1>
            {subtitle && <p className="text-[13px] text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border-[1.5px] border-rose-500 px-[18px] py-2 text-[13px] font-semibold text-rose-500 transition hover:bg-rose-500 hover:text-white"
        >
          Logout
        </button>
      </header>

      <div className="mx-auto max-w-[900px] px-7 py-6">{children}</div>
    </div>
  );
};

export default VolunteerLayout;

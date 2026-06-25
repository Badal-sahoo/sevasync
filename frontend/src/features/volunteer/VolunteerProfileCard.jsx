import { useEffect, useState } from "react";
import { getVolunteerProfile, updateVolunteerProfile } from "../../api/volunteers";
import LocationMapPicker from "./LocationMapPicker";

const parseSkillsInput = (value) =>
  value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

const VolunteerProfileCard = ({ refreshKey = 0 }) => {
  const [profile, setProfile] = useState({ name: "", location: "", skills: [] });
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [skillsInput, setSkillsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isActive = true;
    const fetchProfile = async () => {
      setLoading(true);
      setMessage("");
      try {
        const data = await getVolunteerProfile();
        if (!isActive) return;
        const skills = Array.isArray(data?.skills) ? data.skills : [];
        setProfile({ name: data?.name || "", location: data?.location || "", skills });
        setCoords({ lat: data?.latitude ?? null, lng: data?.longitude ?? null });
        setSkillsInput(skills.join(", "));
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        if (isActive) setLoading(false);
      }
    };
    fetchProfile();
    return () => { isActive = false; };
  }, [refreshKey]);

  const handleMapSelect = (lat, lng) => {
    setCoords({ lat, lng });
    setProfile((prev) => ({ ...prev, location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateVolunteerProfile({
        skills: parseSkillsInput(skillsInput),
        location: profile.location.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
      });
      const volunteer = updated?.data ?? updated;
      const skills = Array.isArray(volunteer?.skills) ? volunteer.skills : [];
      setProfile({ name: volunteer?.name || profile.name, location: volunteer?.location || profile.location, skills });
      setSkillsInput(skills.join(", "));
      setMessage("Profile updated successfully ✅");
    } catch (error) {
      console.error("Update error:", error);
      setMessage("Update failed ❌");
    } finally {
      setSaving(false);
    }
  };

  const cardClass = "flex flex-col gap-4 rounded-2xl border border-[#e2eaf5] bg-white p-6 shadow-sm";

  if (loading) {
    return (
      <section className={cardClass}>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Profile</p>
        <h3 className="text-xl font-extrabold text-[#0a1f5c]">Your Details</h3>
        <p className="text-sm text-slate-500">Loading profile...</p>
      </section>
    );
  }

  return (
    <section className={cardClass}>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Profile</p>
        <h3 className="text-xl font-extrabold text-[#0a1f5c]">{profile.name || "Your Profile"}</h3>
      </div>

      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-slate-600">Location</span>
          <LocationMapPicker
            initialLat={coords.lat}
            initialLng={coords.lng}
            onSelect={handleMapSelect}
            disabled={saving}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-slate-600">Skills</span>
          <textarea
            className="min-h-[90px] w-full resize-y rounded-xl border-[1.5px] border-[#e2eaf5] bg-slate-50 px-3.5 py-2.5 text-sm text-[#0a1f5c] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-[3px] focus:ring-blue-500/15"
            placeholder="e.g. First Aid, Cooking, Logistics"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            disabled={saving}
          />
        </div>

        {profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, i) => (
              <span key={i} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[13px] font-bold text-blue-600">
                {skill}
              </span>
            ))}
          </div>
        )}

        <button
          className="mt-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition hover:-translate-y-px hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Saving..." : "Update Profile"}
        </button>

        {message && (
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm font-semibold text-blue-700">
            {message}
          </p>
        )}
      </form>
    </section>
  );
};

export default VolunteerProfileCard;

import { useEffect, useMemo, useState } from "react";
import { getVolunteerProfile, updateVolunteerProfile, getSkillOptions } from "../../api/volunteers";
import LocationMapPicker from "./LocationMapPicker";

const TIER_STYLE = {
  HIGH: { label: "High priority", dot: "bg-rose-500", text: "text-rose-600" },
  MEDIUM: { label: "Medium priority", dot: "bg-amber-500", text: "text-amber-600" },
  LOW: { label: "Low priority", dot: "bg-emerald-500", text: "text-emerald-600" },
};
const TIER_ORDER = ["HIGH", "MEDIUM", "LOW"];

const VolunteerProfileCard = ({ refreshKey = 0 }) => {
  const [profile, setProfile] = useState({ name: "", location: "", skills: [] });
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillOptions, setSkillOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Flat id -> label map, built once the taxonomy loads, so the selected-skill
  // chips can show a human label instead of a raw skill id.
  const skillLabels = useMemo(() => {
    const map = {};
    Object.values(skillOptions).forEach((tiers) => {
      Object.values(tiers).forEach((skills) => {
        skills.forEach((s) => { map[s.id] = s.label; });
      });
    });
    return map;
  }, [skillOptions]);

  useEffect(() => {
    let isActive = true;
    const fetchAll = async () => {
      setLoading(true);
      setMessage("");
      try {
        const [data, options] = await Promise.all([getVolunteerProfile(), getSkillOptions()]);
        if (!isActive) return;
        const skills = Array.isArray(data?.skills) ? data.skills : [];
        setProfile({ name: data?.name || "", location: data?.location || "", skills });
        setCoords({ lat: data?.latitude ?? null, lng: data?.longitude ?? null });
        setSelectedSkills(skills);
        setSkillOptions(options || {});
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        if (isActive) setLoading(false);
      }
    };
    fetchAll();
    return () => { isActive = false; };
  }, [refreshKey]);

  const handleMapSelect = (lat, lng) => {
    setCoords({ lat, lng });
    setProfile((prev) => ({ ...prev, location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
  };

  const toggleSkill = (skillId) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateVolunteerProfile({
        skills: selectedSkills,
        location: profile.location.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
      });
      const volunteer = updated?.data ?? updated;
      const skills = Array.isArray(volunteer?.skills) ? volunteer.skills : [];
      setProfile({ name: volunteer?.name || profile.name, location: volunteer?.location || profile.location, skills });
      setSelectedSkills(skills);
      setMessage("Profile updated successfully ✅");
    } catch (error) {
      console.error("Update error:", error);
      const apiMessage = error?.response?.data?.skills?.[0];
      setMessage(apiMessage ? `Update failed: ${apiMessage}` : "Update failed ❌");
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
          <p className="text-xs text-slate-400 -mt-0.5">Pick from the fixed skill list below — this is what the matching engine scores against.</p>
          <div className="flex max-h-72 flex-col gap-3 overflow-y-auto rounded-xl border-[1.5px] border-[#e2eaf5] bg-slate-50 p-3.5">
            {Object.entries(skillOptions).map(([needType, tiers]) => (
              <div key={needType} className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#0a1f5c]">{needType}</span>
                <div className="flex flex-col gap-1">
                  {TIER_ORDER.filter((tier) => tiers[tier]?.length).map((tier) =>
                    tiers[tier].map((skill) => (
                      <label
                        key={skill.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[#0a1f5c] hover:bg-white"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill.id)}
                          onChange={() => toggleSkill(skill.id)}
                          disabled={saving}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className={`h-1.5 w-1.5 rounded-full ${TIER_STYLE[tier].dot}`} />
                        <span className="flex-1">{skill.label}</span>
                        <span className={`text-[10px] font-bold uppercase ${TIER_STYLE[tier].text}`}>{tier}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skillId) => (
              <span key={skillId} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[13px] font-bold text-blue-600">
                {skillLabels[skillId] || skillId}
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

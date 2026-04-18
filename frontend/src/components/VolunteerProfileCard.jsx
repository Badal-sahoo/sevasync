import { useEffect, useState } from "react";
import { getVolunteerProfile, updateVolunteerProfile } from "../services/api";
import "./VolunteerProfileCard.css";

const parseSkillsInput = (value) =>
  value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

const VolunteerProfileCard = ({ refreshKey = 0 }) => {
  const [profile, setProfile] = useState({
    name: "",
    location: "",
    skills: [],
  });
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

        setProfile({
          name: data?.name || "",
          location: data?.location || "",
          skills,
        });

        setSkillsInput(skills.join(", "));
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchProfile();
    return () => (isActive = false);
  }, [refreshKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const updated = await updateVolunteerProfile({
        skills: parseSkillsInput(skillsInput),
        location: profile.location.trim(),
      });

      const skills = Array.isArray(updated?.skills) ? updated.skills : [];

      setProfile({
        name: updated?.name || profile.name,
        location: updated?.location || "",
        skills,
      });

      setSkillsInput(skills.join(", "));
      setMessage("Profile updated successfully ✅");
    } catch (error) {
      console.error("Update error:", error);
      setMessage("Update failed ❌");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="volunteer-profile-card">
        <p className="volunteer-profile-card__eyebrow">Profile</p>
        <h3 className="volunteer-profile-card__title">Your Details</h3>
        <p className="volunteer-profile-card__message">Loading profile...</p>
      </section>
    );
  }

  return (
    <section className="volunteer-profile-card">
      {/* 🔹 Header */}
      <div>
        <p className="volunteer-profile-card__eyebrow">Profile</p>
        <h3 className="volunteer-profile-card__title">
          {profile.name || "Your Profile"}
        </h3>
      </div>

      {/* 🔹 Form */}
      <form className="volunteer-profile-card__form" onSubmit={handleSubmit}>
        
        {/* LOCATION */}
        <div className="volunteer-profile-card__field">
          <span>Location</span>
          <input
            type="text"
            className="volunteer-profile-card__input"
            placeholder="Enter your location"
            value={profile.location}
            onChange={(e) =>
              setProfile({ ...profile, location: e.target.value })
            }
            disabled={saving}
          />
        </div>

        {/* SKILLS INPUT */}
        <div className="volunteer-profile-card__field">
          <span>Skills</span>
          <textarea
            className="volunteer-profile-card__textarea"
            placeholder="e.g. First Aid, Cooking, Logistics"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            disabled={saving}
          />
        </div>

        {/* SKILL CHIPS (LIVE PREVIEW 🔥) */}
        {profile.skills.length > 0 && (
          <div className="volunteer-profile-card__chips">
            {profile.skills.map((skill, i) => (
              <span key={i} className="volunteer-profile-card__chip">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* BUTTON */}
        <button
          className="volunteer-profile-card__submit"
          disabled={saving}
        >
          {saving ? "Saving..." : "Update Profile"}
        </button>

        {/* MESSAGE */}
        {message && (
          <p className="volunteer-profile-card__message">{message}</p>
        )}
      </form>
    </section>
  );
};

export default VolunteerProfileCard;
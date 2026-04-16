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

    return () => {
      isActive = false;
    };
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

  return (
    <section className="volunteer-profile-card">
      <h2>{loading ? "Loading..." : profile.name || "Profile"}</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Location"
          value={profile.location}
          onChange={(e) =>
            setProfile({ ...profile, location: e.target.value })
          }
          disabled={loading || saving}
        />

        <textarea
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
          placeholder="skills (comma separated)"
          disabled={loading || saving}
        />

        <button disabled={saving}>
          {saving ? "Saving..." : "Update"}
        </button>

        {message && <p>{message}</p>}
      </form>
    </section>
  );
};

export default VolunteerProfileCard;
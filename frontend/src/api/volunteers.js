import API from "./client";

export const getVolunteerDashboard = async () => {
  const res = await API.get("/volunteers/dashboard/");
  return res.data;
};

export const getVolunteerProfile = async () => {
  const res = await API.get("/volunteers/profile/");
  return res.data;
};

export const getVolunteerPoints = async () => {
  const res = await API.get("/volunteers/points/");
  return res.data;
};

export const updateVolunteerProfile = async ({ skills, location, latitude, longitude }) => {
  const payload = { skills, location };
  if (latitude != null) payload.latitude = latitude;
  if (longitude != null) payload.longitude = longitude;
  const res = await API.patch("/volunteers/me/", payload);
  return res.data;
};

export const updateAvailability = async (availability) => {
  const res = await API.patch("/volunteers/availability/", { availability });
  return res.data;
};

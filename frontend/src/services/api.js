import axios from "axios";

// ✅ Create axios instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // should already include /api
});

// 🔥 Attach Firebase token to EVERY request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");


  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// ==============================
// 🙋 VOLUNTEER APIs (FINAL)
// ==============================

// 📊 Dashboard
export const getVolunteerDashboard = async () => {
  const response = await API.get("/volunteer/dashboard/");
  return response.data;
};

// 👤 Profile
export const getVolunteerProfile = async () => {
  const response = await API.get("/volunteer/profile/");
  return response.data;
};

// 🏆 Points
export const getVolunteerPoints = async () => {
  const response = await API.get("/volunteer/points/");
  return response.data;
};

// 📈 Performance
export const getVolunteerPerformance = async () => {
  const response = await API.get("/volunteer/performance/");
  return response.data;
};

export const completeVolunteerTask = async ({ taskId }) => {
  const response = await API.post("/task/complete/", {
    task_id: taskId,
  });
  return response.data;
};
export const respondToVolunteerTask = async ({ taskId, action }) => {
  const response = await API.post("/task/respond/", {
    task_id: taskId,
    action: action, // "accept" or "reject"
  });

  return response.data;
};
// ==============================
// ✏️ OPTIONAL (keep if using)
// ==============================

// Update profile
export const updateVolunteerProfile = async ({ skills, location }) => {
  const response = await API.patch("/volunteer/update/", {
    skills,
    location,
  });
  return response.data;
};

// Toggle availability
export const updateAvailability = async (availability) => {
  const response = await API.patch("/volunteer/availability/", {
    availability,
  });
  return response.data;
};


// ✅ Export instance
export default API;
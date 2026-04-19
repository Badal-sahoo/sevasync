import axios from "axios";

// =====================================
// 🔹 AXIOS INSTANCE (SINGLE SOURCE)
// =====================================
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // must include /api
});

// =====================================
// 🔐 ATTACH TOKEN AUTOMATICALLY
// =====================================
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =====================================
// 🏢 NGO APIs
// =====================================

// 📊 Dashboard
export const getNgoDashboard = async () => {
  const res = await API.get("/ngo/dashboard/");
  return res.data;
};

// 📋 NGO Requests
export const getNgoRequests = async (urgency = null) => {
  const urgencyMap = {
    1: "HIGH",
    2: "MEDIUM",
    3: "LOW",
  };

  const res = await API.get("/ngo/requests/", {
    params: {
      ...(urgency && { urgency: urgencyMap[urgency] }),
    },
  });

  return res.data;
};

// 📌 Assign Task
export const assignTask = async (taskId, volunteerId) => {
  const res = await API.post("/task/assign/", {
    task_id: taskId,
    volunteer_id: volunteerId,
  });

  return res.data;
};

// 🤖 Match Volunteers
export const matchVolunteers = async (taskId) => {
  const res = await API.post("/match/", {
    task_id: taskId,
  });

  return res.data;
};

// 🗺️ Heatmap
export const getHeatmap = async () => {
  const res = await API.get("/heatmap/");
  return res.data;
};

// 📁 Upload CSV
export const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await API.post("/upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

// ✅ Complete Task (NGO)
export const completeTaskByNgo = async (taskId) => {
  const res = await API.post("/task/update-status/", {
    task_id: taskId,
    status: "completed",
  });

  return res.data;
};

// 🔍 Get Task by ID
export const getTaskById = async (taskId) => {
  const res = await API.get(`/task/${taskId}/`);
  return res.data;
};

// =====================================
// 🙋 VOLUNTEER APIs
// =====================================

// 📊 Dashboard
export const getVolunteerDashboard = async () => {
  const res = await API.get("/volunteer/dashboard/");
  return res.data;
};

// 👤 Profile
export const getVolunteerProfile = async () => {
  const res = await API.get("/volunteer/profile/");
  return res.data;
};

// 🏆 Points
export const getVolunteerPoints = async () => {
  const res = await API.get("/volunteer/points/");
  return res.data;
};

// 📈 Performance
export const getVolunteerPerformance = async () => {
  const res = await API.get("/volunteer/performance/");
  return res.data;
};

// ✅ Accept / Reject Task
export const respondToVolunteerTask = async (taskId, action) => {
  const res = await API.post("/task/respond/", {
    task_id: taskId,
    action: action, // "accept" or "reject"
  });

  return res.data;
};

// ✏️ Update Profile
export const updateVolunteerProfile = async (skills, location) => {
  const res = await API.patch("/volunteer/update/", {
    skills,
    location,
  });

  return res.data;
};

// 🔄 Availability Toggle
export const updateAvailability = async (availability) => {
  const res = await API.patch("/volunteer/availability/", {
    availability,
  });

  return res.data;
};

// 💬 Add Task Update
export const addTaskUpdate = async (taskId, message) => {
  const res = await API.post("/volunteer/addUpdate/", {
    task_id: taskId,
    message,
  });

  return res.data;
};

// 📜 Get Task Updates
export const getTaskUpdates = async (taskId) => {
  const res = await API.get("/volunteer/getUpdate/", {
    params: { task_id: taskId },
  });

  return res.data;
};

// =====================================
// 🔹 EXPORT DEFAULT
// =====================================
export default API;
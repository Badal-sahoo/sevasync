import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api";

// 🔥 CREATE AUTH API INSTANCE
const API = axios.create({
  baseURL: BASE_URL,
});

// 🔥 ADD TOKEN AUTOMATICALLY
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
export const getNgoDashboard = async () => {
  try {
    const res = await API.get("/ngo/dashboard/");   
    return res.data;
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    throw err;
  }
};
export const getNgoRequests = async (urgency = null) => {
  try {
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
  } catch (err) {
    console.error("Error fetching tasks:", err);
    throw err;
  }
};
export const assignTask = async (taskId, volunteerId) => {
  try {
    const res = await API.post("/task/assign/", {
      task_id: taskId,
      volunteer_id: volunteerId,
    });
    return res.data;
  } catch (err) {
    console.error("Error assigning task:", err);
    throw err;
  }
};
export const matchVolunteers = async (taskId) => {
  try {
    const res = await API.post("/match/", {
      task_id: taskId,
    });
    return res.data;
  } catch (err) {
    console.error("Error matching volunteers:", err);
    throw err;
  }
};
export const getHeatmap = async () => {
  try {
    const res = await API.get("/heatmap/");
    return res.data;
  } catch (err) {
    console.error("Error fetching heatmap:", err);
    throw err;
  }
};

export const uploadCSV = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await API.post("/upload/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (err) {
    console.error("Error uploading CSV:", err);
    throw err;
  }
};
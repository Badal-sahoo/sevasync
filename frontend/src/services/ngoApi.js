import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api"; // change if deployed

// ----------------------
// NGO DASHBOARD STATS
// ----------------------
export const getNgoDashboard = async (ngoId) => {
  try {
    const res = await axios.get(`${BASE_URL}/ngo/dashboard/`, {
      params: { ngo_id: ngoId },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    throw err;
  }
};

// ----------------------
// NGO TASK LIST
// ----------------------
export const getNgoRequests = async (ngoId, urgency = null) => {
  try {
    const res = await axios.get(`${BASE_URL}/ngo/requests/`, {
      params: {
        ngo_id: ngoId,
        ...(urgency && { urgency }),
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching tasks:", err);
    throw err;
  }
};

// ----------------------
// MATCH VOLUNTEERS
// ----------------------
export const matchVolunteers = async (taskId) => {
  try {
    const res = await axios.post(`${BASE_URL}/match/`, {
      task_id: taskId,
    });
    return res.data;
  } catch (err) {
    console.error("Error matching volunteers:", err);
    throw err;
  }
};

// ----------------------
// ASSIGN TASK
// ----------------------
export const assignTask = async (taskId, volunteerId) => {
  try {
    const res = await axios.post(`${BASE_URL}/task/assign/`, {
      task_id: taskId,
      volunteer_id: volunteerId,
    });
    return res.data;
  } catch (err) {
    console.error("Error assigning task:", err);
    throw err;
  }
};

// ----------------------
// HEATMAP DATA
// ----------------------
export const getHeatmap = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/heatmap/`);
    return res.data;
  } catch (err) {
    console.error("Error fetching heatmap:", err);
    throw err;
  }
};
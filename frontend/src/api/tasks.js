import API from "./client";

export const getTaskById = async (taskId) => {
  const res = await API.get(`/tasks/${taskId}/`);
  return res.data;
};

export const assignTask = async (taskId, volunteerId) => {
  const res = await API.post(`/tasks/${taskId}/assign/`, {
    volunteer_id: volunteerId,
  });
  return res.data;
};

export const completeTaskByNgo = async (taskId) => {
  const res = await API.post(`/tasks/${taskId}/complete/`);
  return res.data;
};

export const cancelTaskByNgo = async (taskId) => {
  const res = await API.post(`/tasks/${taskId}/cancel/`);
  return res.data;
};

export const cancelRequest = async (taskId, volunteerId) => {
  const res = await API.post(`/tasks/${taskId}/cancel-request/`, {
    volunteer_id: volunteerId,
  });
  return res.data;
};

export const respondToVolunteerTask = async (taskId, action) => {
  const res = await API.post(`/tasks/${taskId}/respond/`, { action });
  return res.data;
};

export const getTaskUpdates = async (taskId) => {
  const res = await API.get(`/tasks/${taskId}/progress/`);
  return res.data;
};

export const addTaskUpdate = async (taskId, message) => {
  const res = await API.post(`/tasks/${taskId}/progress/`, { message });
  return res.data;
};

import API from "./client";

export const getNgoDashboard = async () => {
  const res = await API.get("/ngo/dashboard/");
  return res.data;
};

export const getNgoRequests = async (urgency = null) => {
  const res = await API.get("/ngo/requests/", {
    params: { ...(urgency && { urgency }) },
  });
  return res.data;
};

export const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await API.post("/ngo/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getHeatmap = async () => {
  const res = await API.get("/ngo/heatmap/");
  return res.data;
};

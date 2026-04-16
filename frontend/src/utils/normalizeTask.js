const VALID_STATUSES = new Set(["pending", "requested", "assigned", "completed"]);

const normalizeUrgency = (urgency) => {
  const normalizedUrgency = String(urgency || "LOW").toUpperCase();

  if (["HIGH", "MEDIUM", "LOW"].includes(normalizedUrgency)) {
    return normalizedUrgency;
  }

  return "LOW";
};

export const parseCoordinates = (locationValue) => {
  if (typeof locationValue !== "string") {
    return null;
  }

  const parts = locationValue.split(",").map((part) => part.trim());

  if (parts.length !== 2) {
    return null;
  }

  const latitude = Number.parseFloat(parts[0]);
  const longitude = Number.parseFloat(parts[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
};

const formatCoordinateLabel = (coordinates) => {
  if (!coordinates) {
    return "Location unavailable";
  }

  const latitudeDirection = coordinates.latitude >= 0 ? "N" : "S";
  const longitudeDirection = coordinates.longitude >= 0 ? "E" : "W";

  return `Approx. area near ${Math.abs(coordinates.latitude).toFixed(3)}°${latitudeDirection}, ${Math.abs(coordinates.longitude).toFixed(3)}°${longitudeDirection}`;
};

const normalizeVolunteer = (volunteer) => {
  if (!volunteer) {
    return null;
  }

  return {
    id: volunteer.volunteer_id ?? volunteer.id ?? null,
    name: volunteer.name || "Unassigned",
    skills: Array.isArray(volunteer.skills) ? volunteer.skills : [],
  };
};

const normalizeStatus = (task) => {
  const explicitStatus = String(task?.status || "").toLowerCase();

  if (VALID_STATUSES.has(explicitStatus)) {
    return explicitStatus;
  }

  const assignmentStatus = String(task?.assignment_status || "").toLowerCase();
  if (VALID_STATUSES.has(assignmentStatus)) {
    return assignmentStatus;
  }

  if (task?.assigned_volunteer || task?.volunteer || task?.assigned) {
    return "assigned";
  }

  return "pending";
};

const normalizeTaskType = (task) => {
  const rawType = task?.type || task?.need_type || "general";
  return String(rawType).trim() || "general";
};

export const formatLocationLabel = (locationValue) => {
  const coordinates = parseCoordinates(locationValue);

  if (coordinates) {
    return formatCoordinateLabel(coordinates);
  }

  if (typeof locationValue === "string" && locationValue.trim()) {
    return locationValue.trim();
  }

  return "Location unavailable";
};

export const normalizeTask = (task = {}) => {
  const normalizedVolunteer = normalizeVolunteer(task.assigned_volunteer || task.volunteer);
  const coordinates = parseCoordinates(task.location);
  const peopleCount = Number.parseInt(
    task.total_people ?? task.total_needs ?? task.people ?? 0,
    10
  );
  const status = normalizeStatus(task);
  const type = normalizeTaskType(task);

  return {
    ...task,
    id: task.id ?? task.task_id ?? null,
    taskId: task.id ?? task.task_id ?? null,
    type,
    needType: type,
    urgency: normalizeUrgency(task.urgency),
    status,
    peopleCount: Number.isFinite(peopleCount) ? peopleCount : 0,
    rawLocation: task.location ?? "",
    coordinates,
    locationLabel: formatLocationLabel(task.location),
    assignedVolunteer: normalizedVolunteer,
    isPending: status === "pending",
    isRequested: status === "requested",
    isAssigned: status === "assigned",
    isCompleted: status === "completed",
  };
};

export const normalizeHeatmapPoint = (point = {}) => {
  const latitude = Number.parseFloat(point.lat ?? point.latitude);
  const longitude = Number.parseFloat(point.lng ?? point.lon ?? point.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  return {
    latitude,
    longitude,
    intensity: Number.parseFloat(point.intensity ?? 1) || 1,
    urgency: normalizeUrgency(point.urgency),
  };
};

import React, { useEffect, useState } from "react";
import { getHeatmap } from "../services/ngoApi";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const Heatmap = () => {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const data = await getHeatmap();
        setPoints(data);
      } catch (err) {
        console.error("Error fetching heatmap:", err);
      }
    };

    fetchHeatmap();
  }, []);

  const getColor = (urgency) => {
    if (urgency === "HIGH") return "red";
    if (urgency === "MEDIUM") return "orange";
    return "green";
  };

  return (
    <div style={{ height: "400px", marginBottom: "30px" }}>
      <h3>Need Heatmap</h3>

      <MapContainer
        center={[22.57, 88.36]} // default (can change later)
        zoom={11}
        style={{ height: "100%", borderRadius: "10px" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((p, idx) => (
          <CircleMarker
            key={idx}
            center={[p.lat, p.lng]}
            radius={10}
            pathOptions={{ color: getColor(p.urgency) }}
          >
            <Popup>
              Urgency: {p.urgency}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Heatmap;
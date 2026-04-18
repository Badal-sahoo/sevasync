import React, { useEffect, useState } from "react";
import { getHeatmap } from "../services/ngoApi";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const Heatmap = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const data = await getHeatmap();
        setPoints(data);
      } catch (err) {
        console.error("Error fetching heatmap:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, []);

  const getColor = (urgency) => {
    if (urgency === "HIGH") return "#dc2626";
    if (urgency === "MEDIUM") return "#d97706";
    return "#059669";
  };

  const counts = {
    HIGH: points.filter((p) => p.urgency === "HIGH").length,
    MEDIUM: points.filter((p) => p.urgency === "MEDIUM").length,
    LOW: points.filter((p) => p.urgency === "LOW").length,
  };

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Need Distribution Map</h3>
          <p style={styles.subtitle}>Real-time geographic overview of active requests</p>
        </div>

        {/* LEGEND */}
        <div style={styles.legend}>
          {[
            { label: "High", color: "#dc2626", bg: "#fff1f2", border: "#fecdd3", count: counts.HIGH },
            { label: "Medium", color: "#d97706", bg: "#fffbeb", border: "#fde68a", count: counts.MEDIUM },
            { label: "Low", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", count: counts.LOW },
          ].map((item) => (
            <div key={item.label} style={{ ...styles.legendItem, background: item.bg, border: `1px solid ${item.border}` }}>
              <span style={{ ...styles.legendDot, background: item.color }} />
              <span style={{ ...styles.legendLabel, color: item.color }}>{item.label}</span>
              <span style={{ ...styles.legendCount, color: item.color }}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MAP */}
      <div style={styles.mapContainer}>
        {loading && (
          <div style={styles.mapOverlay}>
            <p style={styles.mapLoading}>Loading map data...</p>
          </div>
        )}
        <MapContainer
          center={[22.57, 88.36]}
          zoom={11}
          style={styles.map}
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
              pathOptions={{
                color: getColor(p.urgency),
                fillColor: getColor(p.urgency),
                fillOpacity: 0.5,
                weight: 2,
              }}
            >
              <Popup>
                <div style={styles.popup}>
                  <strong>Urgency:</strong> {p.urgency}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2eaf5",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(10,31,92,0.06)",
    marginBottom: "8px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px 14px",
    borderBottom: "1px solid #e8eef8",
    flexWrap: "wrap",
    gap: "12px",
  },

  title: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0a1f5c",
    margin: "0 0 2px",
  },

  subtitle: {
    fontSize: "12px",
    color: "#8fa3c0",
    margin: 0,
  },

  legend: {
    display: "flex",
    gap: "8px",
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 10px",
    borderRadius: "8px",
    fontSize: "12px",
  },

  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  legendLabel: {
    fontWeight: "600",
  },

  legendCount: {
    fontWeight: "700",
    fontSize: "11px",
  },

  mapContainer: {
    height: "380px",
    position: "relative",
  },

  map: {
    height: "100%",
    width: "100%",
  },

  mapOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(240,245,255,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 500,
  },

  mapLoading: {
    color: "#5a7299",
    fontSize: "14px",
  },

  popup: {
    fontSize: "13px",
    color: "#0a1f5c",
  },
};

export default Heatmap;

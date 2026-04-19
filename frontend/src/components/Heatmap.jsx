import React, { useEffect, useState } from "react";
import { getHeatmap } from "../services/api";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 🔹 Helper component to dynamically re-center the map when data loads
const MapRecenter = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
      const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
      map.setView([avgLat, avgLng], 13);
    }
  }, [points, map]);
  return null;
};

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

  // 🔹 Map backend "intensity" integer to UI colors and labels
  const getSeverityStyle = (intensity) => {
    if (intensity >= 3) return { color: "#ef4444", label: "High" };    // Red
    if (intensity === 2) return { color: "#f59e0b", label: "Medium" }; // Amber
    return { color: "#10b981", label: "Low" };                         // Emerald
  };

  const counts = {
    HIGH: points.filter((p) => p.intensity >= 3).length,
    MEDIUM: points.filter((p) => p.intensity === 2).length,
    LOW: points.filter((p) => p.intensity === 1).length,
  };

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Deployment Heatmap</h3>
          <p style={styles.subtitle}>Real-time active rescue & supply requests</p>
        </div>

        {/* LEGEND */}
        <div style={styles.legend}>
          {[
            { label: "High", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", count: counts.HIGH },
            { label: "Medium", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", count: counts.MEDIUM },
            { label: "Low", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)", count: counts.LOW },
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
            <div style={styles.spinner} />
            <p style={styles.mapLoading}>Syncing coordinates...</p>
          </div>
        )}
        
        {/* Default fallback to Rourkela coords until data loads */}
        <MapContainer center={[22.22, 84.88]} zoom={11} style={styles.map}>
          <MapRecenter points={points} />
          
          {/* 🔹 Swapped to a sleek Dark Mode base map */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            className="custom-voyager-map" 
          />

          {points.map((p, idx) => {
            const style = getSeverityStyle(p.intensity);
            return (
              <CircleMarker
                key={idx}
                center={[p.lat, p.lng]}
                radius={12 + (p.intensity * 2)} // Higher intensity = slightly larger pulse
                pathOptions={{
                  color: style.color,
                  fillColor: style.color,
                  fillOpacity: 0.6,
                  weight: 1,
                }}
              >
                <Popup>
                  <div style={styles.popup}>
                    <strong>Severity:</strong> {style.label} (Level {p.intensity})
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

// 🔹 High-Tech Glassmorphism Styling
const styles = {
  
  wrapper: {
    background: "rgba(15, 23, 42, 0.65)", // Slate 900 with transparency
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
    overflow: "hidden",
    marginBottom: "16px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    flexWrap: "wrap",
    gap: "16px",
  },

  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#f8fafc",
    margin: "0 0 4px",
    letterSpacing: "0.5px",
  },

  subtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: 0,
  },

  legend: {
    display: "flex",
    gap: "10px",
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)",
  },

  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    boxShadow: "0 0 8px currentColor",
    flexShrink: 0,
  },

  legendLabel: {
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  legendCount: {
    fontWeight: "700",
    fontSize: "12px",
    marginLeft: "4px",
  },

  mapContainer: {
    height: "450px",
    position: "relative",
  },

  map: {
    height: "100%",
    width: "100%",
    background: "#0f172a", // Prevents white flash before tiles load
  },

  mapOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(4px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 500,
  },

  mapLoading: {
    color: "#38bdf8",
    fontSize: "14px",
    fontWeight: "500",
    marginTop: "12px",
    letterSpacing: "1px",
    animation: "pulse 2s infinite",
  },

  popup: {
    fontSize: "13px",
    color: "#0f172a",
    padding: "4px",
  },
};


export default Heatmap;
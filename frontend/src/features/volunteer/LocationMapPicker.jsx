import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Flies map to a position when `flyTo` changes
const MapController = ({ flyTo }) => {
  const map = useMap();
  useEffect(() => {
    if (flyTo) map.flyTo(flyTo, 14, { duration: 1.2 });
  }, [flyTo, map]);
  return null;
};

const ClickHandler = ({ onSelect, disabled }) => {
  useMapEvents({
    click(e) {
      if (!disabled) onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LocationMapPicker = ({ initialLat, initialLng, onSelect, disabled }) => {
  const defaultCenter = [20.5937, 78.9629];
  const hasInitial = initialLat != null && initialLng != null;

  const [markerPos, setMarkerPos] = useState(hasInitial ? [initialLat, initialLng] : null);
  const [flyTo, setFlyTo] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState("");

  // Address autocomplete
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const skipNextSearch = useRef(false);

  const handleSelect = (lat, lng) => {
    setMarkerPos([lat, lng]);
    onSelect(lat, lng);
  };

  // Debounced Nominatim search as the volunteer types an address
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal, headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch (err) {
        if (err.name !== "AbortError") setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450); // debounce + respect Nominatim rate limits

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  const pickResult = (r) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    handleSelect(lat, lng);
    setFlyTo([lat, lng]);
    skipNextSearch.current = true; // don't re-search when we fill the input
    setQuery(r.display_name);
    setResults([]);
    setOpen(false);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setDetecting(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        handleSelect(lat, lng);
        setFlyTo([lat, lng]);
        setDetecting(false);
      },
      () => {
        setGeoError("Could not detect location. Please click on the map manually.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="location-map-picker">
      {/* 🔎 Address search with autocomplete dropdown */}
      <div style={styles.searchWrap}>
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder="Search your address or area…"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          style={styles.searchInput}
        />
        {searching && <span style={styles.spinner}>…</span>}

        {open && results.length > 0 && (
          <ul style={styles.dropdown}>
            {results.map((r) => (
              <li
                key={r.place_id}
                style={styles.dropdownItem}
                onMouseDown={() => pickResult(r)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                📍 {r.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Auto-detect button */}
      <button
        type="button"
        className="location-map-picker__detect-btn"
        onClick={detectLocation}
        disabled={disabled || detecting}
      >
        {detecting ? "Detecting..." : "Use My Location"}
      </button>

      <MapContainer
        center={markerPos || defaultCenter}
        zoom={markerPos ? 12 : 5}
        style={{ height: "240px", width: "100%", borderRadius: "12px" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ClickHandler onSelect={handleSelect} disabled={disabled} />
        <MapController flyTo={flyTo} />
        {markerPos && <Marker position={markerPos} />}
      </MapContainer>

      {geoError && <p className="location-map-picker__error">{geoError}</p>}

      {markerPos ? (
        <p className="location-map-picker__hint">
          Pin set: {markerPos[0].toFixed(5)}, {markerPos[1].toFixed(5)} — search, or click the map to move it
        </p>
      ) : (
        <p className="location-map-picker__hint">
          Search an address, click "Use My Location", or click anywhere on the map
        </p>
      )}
    </div>
  );
};

const styles = {
  searchWrap: { position: "relative", marginBottom: "10px" },
  searchInput: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #dce6f5",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  spinner: { position: "absolute", right: "12px", top: "10px", color: "#8fa3c0", fontSize: "16px" },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #dce6f5",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(10,31,92,0.12)",
    listStyle: "none",
    margin: 0,
    padding: "4px",
    zIndex: 1000,
    maxHeight: "220px",
    overflowY: "auto",
  },
  dropdownItem: {
    padding: "9px 10px",
    fontSize: "12.5px",
    color: "#0a1f5c",
    borderRadius: "8px",
    cursor: "pointer",
    lineHeight: 1.4,
  },
};

export default LocationMapPicker;

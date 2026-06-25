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

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const skipNextSearch = useRef(false);

  const handleSelect = (lat, lng) => {
    setMarkerPos([lat, lng]);
    onSelect(lat, lng);
  };

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
    }, 450);

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
    skipNextSearch.current = true;
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
        handleSelect(pos.coords.latitude, pos.coords.longitude);
        setFlyTo([pos.coords.latitude, pos.coords.longitude]);
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
    <div className="flex flex-col gap-1.5">
      {/* Address search with autocomplete dropdown */}
      <div className="relative mb-2.5">
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder="Search your address or area…"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          className="w-full rounded-lg border border-[#dce6f5] px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
        />
        {searching && <span className="absolute right-3 top-2.5 text-base text-slate-400">…</span>}

        {open && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-[calc(100%+4px)] z-[1000] max-h-56 overflow-y-auto rounded-xl border border-[#dce6f5] bg-white p-1 shadow-[0_8px_24px_rgba(10,31,92,0.12)]">
            {results.map((r) => (
              <li
                key={r.place_id}
                onMouseDown={() => pickResult(r)}
                className="cursor-pointer rounded-lg px-2.5 py-2 text-[12.5px] leading-snug text-[#0a1f5c] hover:bg-blue-50"
              >
                📍 {r.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={detectLocation}
        disabled={disabled || detecting}
        className="w-full rounded-lg border-[1.5px] border-blue-500 bg-blue-50 px-3.5 py-2.5 text-sm font-bold text-blue-600 transition hover:-translate-y-px hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
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

      {geoError && <p className="m-0 text-xs font-medium text-rose-600">{geoError}</p>}

      <p className="m-0 text-xs font-medium text-slate-500">
        {markerPos
          ? `Pin set: ${markerPos[0].toFixed(5)}, ${markerPos[1].toFixed(5)} — search, or click the map to move it`
          : 'Search an address, click "Use My Location", or click anywhere on the map'}
      </p>
    </div>
  );
};

export default LocationMapPicker;

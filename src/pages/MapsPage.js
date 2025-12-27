import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// --- FIX ICONS ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- HELPER: Smooth Fly to Location ---
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 2 });
  }, [position, map]);
  return null;
}

export default function MapsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State
  const [userPos, setUserPos] = useState([11.1085, 77.3411]); // Default: Tiruppur
  const [destPos, setDestPos] = useState(null); 
  const [destName, setDestName] = useState("");
  const [routeCoords, setRouteCoords] = useState([]); // <--- New State for Road Route

  // 1. SETUP ON LOAD
  useEffect(() => {
    if (location.state && location.state.dest) {
      setDestName(location.state.dest);
      setDestPos([11.1018, 77.3435]); // Simulated Destination (Railway Station)
    }
  }, [location]);

  // 2. FETCH REAL ROAD ROUTE (OSRM API)
  useEffect(() => {
    if (!userPos || !destPos) return;

    // OSRM requires "Longitude,Latitude" format
    const start = `${userPos[1]},${userPos[0]}`;
    const end = `${destPos[1]},${destPos[0]}`;

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          // OSRM returns [Lng, Lat], but Leaflet needs [Lat, Lng]
          const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoords(coords);
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };

    fetchRoute();
  }, [userPos, destPos]); // Run whenever positions change

  // 3. GPS FUNCTION
  const locateUser = () => {
    if (!navigator.geolocation) return alert("GPS not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => alert("GPS Error")
    );
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <div style={{ padding: 15, background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center', zIndex: 1000 }}>
        <button onClick={() => navigate(-1)} style={{ background:'#334155', color:'white', border:'none', padding:'8px 12px', borderRadius:5, cursor:'pointer'}}>⬅ Back</button>
        <span style={{fontWeight:'bold'}}>{destName ? `To: ${destName}` : "Maps"}</span>
        <button onClick={locateUser} style={{ background:'#2563eb', color:'white', border:'none', padding:'8px 12px', borderRadius:5, cursor:'pointer'}}>📍 GPS</button>
      </div>

      {/* MAP */}
      <div style={{ flex: 1, width: "100%", height: "100%" }}>
        <MapContainer 
          center={userPos} 
          zoom={13} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <FlyToLocation position={destPos || userPos} />

          {/* Markers */}
          <Marker position={userPos}><Popup>You</Popup></Marker>
          {destPos && <Marker position={destPos}><Popup>{destName}</Popup></Marker>}

          {/* REAL ROAD ROUTE (Blue Line) */}
          {routeCoords.length > 0 && (
             <Polyline positions={routeCoords} color="blue" weight={5} opacity={0.7} />
          )}

          {/* Fallback Straight Line (if OSRM fails) */}
          {destPos && routeCoords.length === 0 && (
             <Polyline positions={[userPos, destPos]} color="red" dashArray="5, 10" />
          )}

        </MapContainer>
      </div>
    </div>
  );
}
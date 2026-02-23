import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "../App.css";

const socket = io("http://127.0.0.1:5000");

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [driverName, setDriverName] = useState("");
  const [driverId, setDriverId] = useState("");
  const [myVehicleType, setMyVehicleType] = useState("");
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [wallet] = useState(0);
  const [otpInput, setOtpInput] = useState("");
  const [activeRide, setActiveRide] = useState(null);
  const [rideStatus, setRideStatus] = useState("SEARCHING");

  const getLocations = useCallback((fullString) => {
    if (!fullString) return { pickup: "", drop: "" };
    const parts = fullString.split("➡️");
    return { pickup: parts[0]?.trim() || fullString, drop: parts[1]?.trim() || "" };
  }, []);

  const fetchHistory = useCallback(async (id) => {
    if (!id) return;
    try {
      // ✅ Corrected URL to match 127.0.0.1 for stability
      const response = await fetch(`http://127.0.0.1:5000/api/ride/driver-history/${id}`);
      const data = await response.json();
      if (data.success) setHistory(data.history);
    } catch (error) { console.error("History Error", error); }
  }, []);

  const fetchActiveRide = useCallback(async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/ride/active-driver/${id}`);
      const data = await response.json();
      if (data.success && data.ride) {
        setActiveRide(data.ride);
        // Map backend status to frontend state
        if (data.ride.status === "Accepted") setRideStatus("TO_PICKUP");
        else if (data.ride.status === "Arrived") setRideStatus("AT_PICKUP");
        else if (data.ride.status === "In Progress") setRideStatus("TO_DROP");
      } else {
        setActiveRide(null);
        setRideStatus("SEARCHING");
      }
    } catch (error) { console.error("Active Ride Error", error); }
  }, []);

  const fetchRequests = useCallback(async () => {
    if (activeRide) return;
    try {
      const response = await fetch('http://127.0.0.1:5000/api/ride/pending');
      const data = await response.json();
      if (data.success) {
        const myType = sessionStorage.getItem("viz_driver_type");
        setRequests(data.rides.filter(ride => ride.vehicleType === myType));
      }
    } catch (error) { console.error("Request Error", error); }
  }, [activeRide]);

  useEffect(() => {
    const name = sessionStorage.getItem("viz_driver_name");
    const id = sessionStorage.getItem("viz_driver_id");
    const type = sessionStorage.getItem("viz_driver_type");

    if (!id || !name) { navigate("/driver-login"); return; }

    setDriverName(name);
    setDriverId(id);
    setMyVehicleType(type);

    fetchHistory(id);
    fetchActiveRide(id);

    // SOCKET SETUP
    socket.emit('join_driver_pool', type);

    socket.on('new_ride_request', (ride) => {
      if (ride.vehicleType === type) {
        setRequests(prev => [ride, ...prev]);
      }
    });

    socket.on('ride_taken', ({ rideId }) => {
      setRequests(prev => prev.filter(r => r._id !== rideId));
    });

    // Initial Fetch
    fetchRequests();

    return () => {
      socket.off('new_ride_request');
      socket.off('ride_taken');
    };
  }, [navigate, fetchRequests, fetchHistory, fetchActiveRide]);

  const acceptRide = async (ride) => {
    try {
      await fetch('http://127.0.0.1:5000/api/ride/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: ride._id, driverId, driverName, vehicleNumber: "TN-38-BZ-1234" })
      });
      setActiveRide(ride);
      setRideStatus("TO_PICKUP");
    } catch (error) { alert("Failed to accept."); }
  };

  const updateStatus = async (status, frontendState) => {
    try {
      await fetch('http://127.0.0.1:5000/api/ride/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide._id, status })
      });
      setRideStatus(frontendState);
    } catch (e) { alert("Error updating status"); }
  };

  const startTrip = () => {
    if (otpInput === activeRide.otp) {
      updateStatus("In Progress", "TO_DROP");
    } else {
      alert("Invalid OTP! Check with passenger.");
    }
  };

  const openNavigation = (locationStr) => {
    // Navigate to MapsPage with the destination name
    const dest = getLocations(locationStr).pickup; // Generic for now
    navigate("/map", { state: { dest } });
  };

  const completeRide = async () => {
    try {
      await fetch('http://127.0.0.1:5000/api/ride/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide._id })
      });
      setActiveRide(null);
      setRideStatus("SEARCHING");
      setOtpInput("");
      fetchHistory(driverId);
    } catch (e) { alert("Error finishing ride"); }
  };

  const locs = activeRide ? getLocations(activeRide.pickupLocation) : { pickup: "", drop: "" };

  return (
    <div className="driver-container" style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.driverName}>Hi, {driverName}</h1>
          <div style={{ display: 'flex', gap: '5px' }}>
            <div style={styles.badge}>{myVehicleType} Expert</div>
            <div style={{ ...styles.badge, background: '#10b981' }}>₹{wallet} Wallet</div>
          </div>
        </div>
        <button onClick={() => { sessionStorage.clear(); navigate("/"); }} style={styles.logoutBtn}>Logout</button>
      </header>

      <main style={styles.main}>
        {activeRide ? (
          <div style={styles.activeCard}>
            <div style={styles.statusIndicator}>{rideStatus.replace("_", " ")}</div>
            <h2>{activeRide.riderName}</h2>
            <p style={{ fontSize: '1.2rem' }}>
              {rideStatus === "TO_DROP" ? locs.drop : locs.pickup}
            </p>

            {rideStatus === "TO_PICKUP" && (
              <>
                <button onClick={() => openNavigation(activeRide.pickupLocation)} style={{ ...styles.primaryBtn, background: '#3b82f6', marginBottom: '10px' }}>📍 NAVIGATE TO PICKUP</button>
                <button onClick={() => updateStatus("Arrived", "AT_PICKUP")} style={styles.primaryBtn}>I REACHED PICKUP</button>
              </>
            )}

            {rideStatus === "AT_PICKUP" && (
              <>
                <input
                  type="tel"
                  placeholder="ENTER OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  style={styles.otpInput}
                />
                <button onClick={startTrip} style={{ ...styles.primaryBtn, background: '#3b82f6' }}>START TRIP</button>
              </>
            )}

            {rideStatus === "TO_DROP" && (
              <>
                <button onClick={() => openNavigation(activeRide.pickupLocation)} style={{ ...styles.primaryBtn, background: '#3b82f6', marginBottom: '10px' }}>📍 NAVIGATE TO DROP</button>
                <button onClick={completeRide} style={styles.primaryBtn}>COMPLETE TRIP</button>
              </>
            )}
          </div>
        ) : (
          <div style={styles.requestSection}>
            <h2 style={styles.sectionTitle}>Available Requests ({requests.length})</h2>
            {requests.map(ride => (
              <div key={ride._id} style={styles.requestCard}>
                <div style={styles.reqTop}>
                  <span style={styles.reqLoc}>📍 {getLocations(ride.pickupLocation).pickup}</span>
                  <span style={styles.reqUser}>{ride.riderName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>🛣️ {ride.distance || 0} km</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>₹{ride.fare || 0}</span>
                </div>
                <button onClick={() => acceptRide(ride)} style={styles.acceptBtn}>ACCEPT RIDE</button>
              </div>
            ))}
          </div>
        )}

        <div style={styles.historySection}>
          <h2 style={styles.sectionTitle}>Recent Trip History</h2>
          {history.length === 0 ? <p style={styles.emptyText}>No trips found for this account.</p> :
            history.map(item => (
              <div key={item._id} style={styles.historyCard}>
                <div style={styles.historyTop}>
                  {/* ✅ Corrected Date Logic */}
                  <span style={styles.historyDate}>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Recent'}</span>
                  <span style={styles.historyStatus}>✅ COMPLETED</span>
                </div>
                <p style={styles.historyLoc}>{item.pickupLocation}</p>
              </div>
            ))
          }
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '0 20px' },
  header: { padding: '30px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  driverName: { fontSize: '1.5rem', margin: 0 },
  badge: { fontSize: '0.7rem', background: '#3b82f6', padding: '3px 8px', borderRadius: '12px' },
  logoutBtn: { background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '5px 12px', borderRadius: '8px' },
  activeCard: { background: '#1e293b', borderRadius: '24px', padding: '25px', textAlign: 'center' },
  primaryBtn: { background: '#22c55e', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 'bold', width: '100%', marginTop: '10px' },
  requestCard: { background: '#1e293b', padding: '20px', borderRadius: '20px', marginBottom: '15px' },
  reqTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  reqLoc: { fontSize: '1.1rem', fontWeight: 'bold' },
  acceptBtn: { background: 'white', color: '#0f172a', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', width: '100%' },
  historyCard: { background: '#111827', padding: '15px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #1f2937' },
  historyTop: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' },
  historyStatus: { color: '#22c55e', fontWeight: 'bold' },
  historyLoc: { margin: 0, fontSize: '0.9rem', color: '#cbd5e1' },
  otpInput: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', textAlign: 'center' }
};
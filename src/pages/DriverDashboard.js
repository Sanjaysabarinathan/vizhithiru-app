import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [driverName, setDriverName] = useState("");
  const [driverId, setDriverId] = useState("");
  const [myVehicleType, setMyVehicleType] = useState(""); 
  const [requests, setRequests] = useState([]); 
  const [otpInput, setOtpInput] = useState(""); 
  
  const [activeRide, setActiveRide] = useState(null); 
  // NEW STATUSES: SEARCHING -> TO_PICKUP -> AT_PICKUP -> TO_DROP
  const [rideStatus, setRideStatus] = useState("SEARCHING"); 

  // --- HELPER: PARSE LOCATIONS ---
  // The backend sends: "Gandhipuram ➡️ Tiruppur"
  // We split it so we can show just ONE at a time.
  const getLocations = (fullString) => {
      if(!fullString) return { pickup: "", drop: "" };
      const parts = fullString.split("➡️");
      return {
          pickup: parts[0] ? parts[0].trim() : fullString,
          drop: parts[1] ? parts[1].trim() : ""
      };
  };

  // --- FETCH REQUESTS ---
  const fetchRequests = useCallback(async () => {
    if(activeRide) return; // Stop fetching if busy

    try {
      const response = await fetch('http://127.0.0.1:5000/api/ride/pending');
      const data = await response.json();
      if (data.success) {
        // Filter by my vehicle type
        const myType = sessionStorage.getItem("viz_driver_type");
        const relevantRides = data.rides.filter(ride => ride.vehicleType === myType);
        setRequests(relevantRides);
      }
    } catch (error) { console.error(error); }
  }, [activeRide]);

  // --- SETUP ---
  useEffect(() => {
    const name = sessionStorage.getItem("viz_driver_name");
    const type = sessionStorage.getItem("viz_driver_type");
    
    if (!name) { navigate("/driver-login"); return; }
    
    setDriverName(name);
    setDriverId(sessionStorage.getItem("viz_driver_id"));
    setMyVehicleType(type);
    
    const interval = setInterval(fetchRequests, 3000);
    return () => clearInterval(interval);
  }, [navigate, fetchRequests]);

  // --- 1. ACCEPT RIDE ---
  const acceptRide = async (ride) => {
    const vehicleNumber = "TN-38-BZ-1234"; // Ideally fetch from storage
    try {
      await fetch('http://127.0.0.1:5000/api/ride/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: ride._id, driverId, driverName, vehicleNumber })
      });
      setActiveRide(ride);
      setRideStatus("TO_PICKUP"); // 🚦 STEP 1: Go to Customer
      alert("✅ Ride Accepted! Heading to Pickup.");
    } catch (error) { alert("Failed to accept."); }
  };

  // --- 2. DRIVER REACHED ---
  const handleReachedPickup = () => {
      const confirm = window.confirm("Have you reached the passenger's location?");
      if(confirm) {
          setRideStatus("AT_PICKUP"); // 🚦 STEP 2: Ask for OTP
      }
  };

  // --- 3. VERIFY OTP ---
  const verifyOtp = async () => {
    if(!activeRide) return;
    try {
       const res = await fetch('http://127.0.0.1:5000/api/ride/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide._id, enteredOtp: otpInput })
      });
      const data = await res.json();
      if(data.success) {
          alert("🎉 OTP Verified! Start the Trip.");
          setRideStatus("TO_DROP"); // 🚦 STEP 3: Go to Drop
      } else {
          alert("❌ WRONG OTP!");
      }
    } catch(e) { console.error(e); }
  };

  // --- MAP HELPER ---
  const openMap = (address) => {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
  };

  // --- 4. COMPLETE RIDE ---
  const completeRide = async () => {
      if(!window.confirm("End the trip?")) return;
      try {
        await fetch('http://127.0.0.1:5000/api/ride/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rideId: activeRide._id })
        });
        alert("✅ Ride Completed! Good job.");
        setActiveRide(null);
        setRideStatus("SEARCHING");
        setOtpInput("");
        fetchRequests(); 
      } catch(e) { alert("Error"); }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  // Helper to safely get addresses
  const locs = activeRide ? getLocations(activeRide.pickupLocation) : { pickup: "", drop: "" };

  return (
    <div className="app-container" style={{ padding: 20, background: '#f1f5f9' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
          <div>
            <h2 style={{margin:0}}>🚖 {driverName}</h2>
            <span style={{fontSize:'0.8rem', background:'#e2e8f0', padding:'2px 8px', borderRadius:4, color:'#475569'}}>
                {myVehicleType} Driver
            </span>
          </div>
          <button onClick={handleLogout} style={{background:'#ef4444', color:'white', border:'none', padding:'5px 10px', borderRadius:5}}>Logout</button>
      </div>

      {/* --- PHASE 1: DRIVING TO PICKUP --- */}
      {activeRide && rideStatus === "TO_PICKUP" && (
        <div style={{background:'#eff6ff', padding:20, borderRadius:15, border:'2px solid #3b82f6', textAlign:'center'}}>
            <h3 style={{color:'#1e3a8a', marginTop:0}}>📍 GO TO PICKUP</h3>
            <p style={{fontSize:'1.1rem'}}>Customer is at:</p>
            <h2 style={{margin:'10px 0'}}>{locs.pickup}</h2>
            
            <button onClick={() => openMap(locs.pickup)} className="app-btn" style={{background:'#3b82f6', width:'100%', marginBottom:10}}>
                🗺️ Navigate to Pickup
            </button>

            <div style={{marginTop:20, borderTop:'1px solid #bfdbfe', paddingTop:20}}>
                <button onClick={handleReachedPickup} className="app-btn" style={{background:'#0f172a', width:'100%'}}>
                    👋 I REACHED LOCATION
                </button>
            </div>
        </div>
      )}

      {/* --- PHASE 2: AT LOCATION (ENTER OTP) --- */}
      {activeRide && rideStatus === "AT_PICKUP" && (
        <div style={{background:'#fff7ed', padding:20, borderRadius:15, border:'2px solid #f97316'}}>
            <h3 style={{color:'#c2410c', marginTop:0}}>🔑 VERIFY CUSTOMER</h3>
            <p>You are at <b>{locs.pickup}</b>.</p>
            <p>Ask <b>{activeRide.riderName}</b> for the OTP.</p>
            
            <div style={{background:'white', padding:15, borderRadius:10, marginTop:10, display:'flex', gap:10}}>
                <input type="tel" maxLength="4" placeholder="0000" value={otpInput} onChange={(e) => setOtpInput(e.target.value)}
                    style={{padding:10, fontSize:'1.5rem', width:'100px', borderRadius:5, border:'1px solid #ccc', textAlign:'center'}} />
                <button onClick={verifyOtp} className="app-btn btn-blue" style={{background:'#ea580c', flex:1}}>START TRIP</button>
            </div>
        </div>
      )}

      {/* --- PHASE 3: DRIVING TO DROP --- */}
      {activeRide && rideStatus === "TO_DROP" && (
        <div style={{background:'#dcfce7', padding:20, borderRadius:15, border:'2px solid #16a34a', textAlign:'center'}}>
            <h3 style={{color:'#15803d', marginTop:0}}>🚀 ON THE WAY</h3>
            <p style={{fontSize:'1.1rem'}}>Drop location:</p>
            <h2 style={{margin:'10px 0'}}>{locs.drop}</h2>
            
            <button onClick={() => openMap(locs.drop)} className="app-btn" style={{background:'#2563eb', width:'100%', marginBottom:15}}>
                🗺️ Navigate to Drop
            </button>

            <button onClick={completeRide} className="app-btn" style={{background:'#16a34a', width:'100%'}}>
                ✅ TRIP COMPLETED
            </button>
        </div>
      )}

      {/* --- PHASE 0: SEARCHING --- */}
      {!activeRide && (
          <div>
            <h3 style={{color:'#64748b'}}>Requests ({myVehicleType} Only)</h3>
            {requests.length === 0 && <p>Searching for passengers...</p>}
            
            {requests.map((ride) => (
                <div key={ride._id} style={{background: 'white', padding: 20, marginBottom:10, borderRadius: 15, border: '1px solid #e2e8f0', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                    {/* Parse location to show just pickup in the card */}
                    <h3 style={{marginTop:0}}>📍 {getLocations(ride.pickupLocation).pickup}</h3>
                    <p>Passenger: <b>{ride.riderName}</b></p>
                    <span style={{background:'#e0f2fe', padding:'3px 8px', borderRadius:5, fontSize:'0.8rem', color:'#0284c7'}}>Req: {ride.vehicleType}</span>
                    <button onClick={() => acceptRide(ride)} className="app-btn" style={{ background: '#0f172a', marginTop:10 }}>✅ ACCEPT RIDE</button>
                </div>
            ))}
          </div>
      )}
    </div>
  );
}
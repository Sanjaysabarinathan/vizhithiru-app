import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import "../App.css"; 

// 🗣️ TRANSLATION DICTIONARY
const DICTIONARY = {
  en: { 
    welcome: "Select a vehicle", 
    searching: "Searching for driver...",
    cancel: "Cancelled.",
    fare: "Fare is approx 50 rupees",
    confirm: "Booking confirmed.",
    cleared: "History cleared.",
    listening: "Listening...",
    speakNow: "Say 'Pickup X' or 'Drop Y'",
    pickup: "Pickup Location",
    drop: "Drop Location",
    askLocation: "selected. Please say or type your pickup and drop location."
  },
  ta: { 
    welcome: "Vaaganathai therndhedukkavum", 
    searching: "Driverai thedugirom...",
    cancel: "Ratthu seiyyapatthu.",
    fare: "Kattanam 50 rubai.",
    confirm: "Urudhi aayirru.",
    cleared: "Varalaaru alikkapattadhu.",
    listening: "Kavanikkirathu...",
    speakNow: "Sollavum 'Pickup...' allathu 'Drop...'",
    pickup: "Yeri kollum idam",
    drop: "Irangum idam",
    askLocation: "thervu seiyapattathu. Pickup mattrum Drop idathai sollavum."
  }
};

export default function TravelPage() {
  const navigate = useNavigate(); 
  
  // --- STATE ---
  const [lang, setLang] = useState("en"); 
  const [status, setStatus] = useState("IDLE"); 
  const [transcript, setTranscript] = useState("");
  
  // Booking State
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pickupLoc, setPickupLoc] = useState(""); 
  const [dropLoc, setDropLoc] = useState("");     
  const [bookings, setBookings] = useState([]);

  // Session Data
  const userName = sessionStorage.getItem("viz_user_name") || "User";
  const userPhone = sessionStorage.getItem("viz_guardian_phone"); 

  const recognitionRef = useRef(null);

  // --- HELPER 1: TRANSLATE ---
  const t = useCallback((key) => DICTIONARY[lang][key] || key, [lang]);

  // --- HELPER 2: SPEAK ---
  const speak = useCallback((text) => {
    if(status === "SEARCHING") return; 
    if(recognitionRef.current) recognitionRef.current.stop();

    setStatus("SPEAKING");
    window.speechSynthesis.cancel();
    
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "en" ? "en-IN" : "ta-IN";
    u.onend = () => setStatus("IDLE");
    window.speechSynthesis.speak(u);
  }, [lang, status]);

  // --- HELPER 3: FETCH HISTORY ---
  const fetchHistory = useCallback(async () => {
    if(!userPhone) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/ride/history/${userPhone}`);
      const data = await res.json();
      if (data.success) setBookings(data.history);
    } catch (e) { console.error("History Error", e); }
  }, [userPhone]);

  const clearHistory = async () => {
      if(!window.confirm("Delete history?")) return;
      try {
          const res = await fetch(`http://127.0.0.1:5000/api/ride/clear/${userPhone}`, { method: 'DELETE' });
          if((await res.json()).success) { setBookings([]); speak(t('cleared')); }
      } catch(e) { alert("Failed"); }
  };

  // --- ACTION: SELECT VEHICLE & PROMPT USER ---
  // ✅ FIXED: Wrapped in useCallback to satisfy linter
  const handleVehicleSelect = useCallback((vehicle) => {
      setSelectedVehicle(vehicle);
      speak(`${vehicle} ${t('askLocation')}`);
  }, [speak, t]);

  // --- ACTION: GPS LOCATION ---
  const getGPSLocation = () => {
    if (!navigator.geolocation) return alert("GPS not supported");
    setStatus("SEARCHING"); speak("Getting location...");

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
            const res = await fetch(url);
            const data = await res.json();
            const address = data.display_name.split(",").slice(0, 2).join(",");
            
            setPickupLoc(address); 
            setStatus("IDLE");
            speak(`Pickup set to: ${address}`);
        } catch (e) { alert("Location Error"); setStatus("IDLE"); }
    }, () => { alert("GPS Denied"); setStatus("IDLE"); });
  };

  // --- ACTION: FINALIZE BOOKING ---
  const finalizeBooking = useCallback(async () => {
    if(!pickupLoc || !dropLoc) {
        speak("Please enter both Pickup and Drop locations.");
        return alert("⚠️ Please enter both locations!");
    }

    const newOtp = Math.floor(1000 + Math.random() * 9000).toString(); 
    setStatus("SEARCHING"); speak(`${t('searching')}`);

    const combinedRoute = `${pickupLoc} ➡️ ${dropLoc}`;

    try {
      const response = await fetch('http://127.0.0.1:5000/api/ride/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            riderName: userName, 
            riderPhone: userPhone, 
            vehicleType: selectedVehicle, 
            pickupLocation: combinedRoute, 
            otp: newOtp 
        })
      });
      const data = await response.json();
      if (data.success) { speak(`Booking Sent. OTP is ${newOtp}`); alert(`✅ OTP CODE: ${newOtp}`); fetchHistory(); } 
    } catch (error) { speak("Connection Failed"); }
    
    setStatus("IDLE"); setSelectedVehicle(null); setPickupLoc(""); setDropLoc("");
  }, [pickupLoc, dropLoc, selectedVehicle, userName, userPhone, speak, t, fetchHistory]);

  // --- ACTION: VOICE COMMANDS ---
  const handleIntent = useCallback((text) => {
    const lower = text.toLowerCase();
    console.log("🗣️ Heard:", lower); 

    if (lower.includes("cancel")) { setSelectedVehicle(null); return speak(t('cancel')); }

    if (selectedVehicle) {
      if (lower.includes("confirm") || lower.includes("book")) {
          finalizeBooking();
      } 
      else if (lower.includes("pickup") || lower.includes("start")) {
          const loc = text.replace(/pickup|start|at|from/gi, "").trim();
          setPickupLoc(loc);
          speak(`Pickup: ${loc}`);
      }
      else if (lower.includes("drop") || lower.includes("to") || lower.includes("go to")) {
          const loc = text.replace(/drop|to|go to/gi, "").trim();
          setDropLoc(loc);
          speak(`Drop: ${loc}`);
      }
      else {
          if(pickupLoc && !dropLoc) setDropLoc(text);
          else setPickupLoc(text);
      }
      return;
    }

    // Vehicle Selection
    if (lower.includes("auto")) handleVehicleSelect("Auto");
    else if (lower.includes("bike")) handleVehicleSelect("Bike");
    else if (lower.includes("bus")) handleVehicleSelect("Bus");
    else if (lower.includes("train")) handleVehicleSelect("Train");
    
  }, [selectedVehicle, pickupLoc, dropLoc, speak, t, finalizeBooking, handleVehicleSelect]); // ✅ Added handleVehicleSelect dependency

  // --- SETUP ---
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang === "en" ? "en-IN" : "ta-IN";
    rec.onstart = () => setStatus("LISTENING");
    rec.onresult = (e) => { const text = e.results[0][0].transcript; setTranscript(text); handleIntent(text); };
    rec.onend = () => setStatus("IDLE");
    recognitionRef.current = rec;
  }, [lang, handleIntent]);

  useEffect(() => { fetchHistory(); const i = setInterval(fetchHistory, 3000); return () => clearInterval(i); }, [fetchHistory]);
  const startListening = () => { if (recognitionRef.current && status === "IDLE") recognitionRef.current.start(); };

  return (
    <div className="app-container">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <button onClick={() => navigate("/home")} className="back-btn">⬅ Home</button>
        <button onClick={() => setLang(lang === "en" ? "ta" : "en")} className="app-btn btn-slate" style={{padding:'5px 15px', fontSize:'0.8rem'}}>{lang === "en" ? "🇮🇳 Tamil" : "🇬🇧 English"}</button>
      </div>

      {/* BOOKING FORM */}
      {selectedVehicle && (
        <div style={{background: 'white', padding: 20, margin: '20px 0', borderRadius: 15, border: '2px solid #2563eb'}}>
          <h3 style={{marginTop: 0, color: '#1e293b'}}>📍 Book {selectedVehicle}</h3>
          
          <div style={{marginBottom: 15}}>
              <label style={{fontSize:'0.9rem', color:'#64748b', fontWeight:'bold'}}>🟢 {t('pickup')}</label>
              <div style={{display:'flex', gap:10, marginTop:5}}>
                  <input type="text" placeholder="Start Location" value={pickupLoc} onChange={(e) => setPickupLoc(e.target.value)} style={inputStyle} />
                  <button onClick={getGPSLocation} style={{padding:'10px', background:'#e2e8f0', border:'none', borderRadius:8, cursor:'pointer'}}>📍 GPS</button>
              </div>
          </div>

          <div style={{marginBottom: 15}}>
              <label style={{fontSize:'0.9rem', color:'#64748b', fontWeight:'bold'}}>🔴 {t('drop')}</label>
              <input type="text" placeholder="End Location" value={dropLoc} onChange={(e) => setDropLoc(e.target.value)} style={{...inputStyle, marginTop:5, width:'93%'}} />
          </div>

          <div onClick={startListening} style={{textAlign:'center', margin:'10px 0', cursor:'pointer'}}>
             <span style={{fontSize:'1.5rem', background: status==='LISTENING'?'#dcfce7':'#f1f5f9', padding:10, borderRadius:'50%'}}>
                 {status === "SPEAKING" ? "🔊" : "🎤"}
             </span>
             <p style={{margin:0, fontSize:'0.8rem', color:'#64748b'}}>{status === "LISTENING" ? "Listening..." : "Tap to Speak"}</p>
          </div>

          <div style={{display:'flex', gap:10}}>
            <button onClick={() => setSelectedVehicle(null)} style={{flex:1, padding: 12, background: '#fee2e2', color:'red', borderRadius: 8, border:'none', cursor:'pointer'}}>Cancel</button>
            <button onClick={finalizeBooking} className="app-btn btn-blue" style={{flex:2, background: '#22c55e'}}>✅ CONFIRM</button>
          </div>
        </div>
      )}

      {/* VEHICLE GRID */}
      {!selectedVehicle && (
        <div>
            <div className="status-card" onClick={startListening} style={{cursor:'pointer', border: status === "LISTENING" ? '2px solid #22c55e' : '1px solid #e2e8f0', marginBottom:20}}>
            <div className={`mic-icon ${status === "LISTENING" ? "active" : ""}`}>{status === "SPEAKING" ? "🔊" : "🎤"}</div>
            <p style={{color:'var(--secondary)', margin:0, fontWeight:'bold'}}>{status === "LISTENING" ? t('listening') : transcript || t('speakNow')}</p>
            </div>

            <div className="btn-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
                <button className="app-btn btn-amber" onClick={() => handleVehicleSelect("Auto")}><span style={{fontSize:'1.5rem'}}>🛺</span> Auto</button>
                <button className="app-btn btn-orange" onClick={() => handleVehicleSelect("Bike")}><span style={{fontSize:'1.5rem'}}>🛵</span> Bike</button>
                <button className="app-btn btn-green" onClick={() => handleVehicleSelect("Bus")}><span style={{fontSize:'1.5rem'}}>🚌</span> Bus</button>
                <button className="app-btn btn-blue" onClick={() => handleVehicleSelect("Train")}><span style={{fontSize:'1.5rem'}}>🚆</span> Train</button>
            </div>
        </div>
      )}

      {/* HISTORY */}
      <div style={{marginTop: 20}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
            <h3 style={{color: '#334155', margin:0}}>Recent Rides</h3>
            {bookings.length > 0 && (<button onClick={clearHistory} style={{background:'#ef4444', color:'white', border:'none', padding:'5px 10px', borderRadius:5, cursor:'pointer', fontSize:'0.8rem'}}>🗑️ Clear</button>)}
        </div>
        {bookings.length === 0 && <p style={{color:'#64748b'}}>No recent rides found.</p>}
        {bookings.map((b) => (
          <div key={b._id} style={{background:'white', padding:15, borderRadius:12, marginBottom:10, borderLeft: b.status==='Accepted'?'5px solid #22c55e':'5px solid #f59e0b', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}}>
            <div style={{fontWeight:'bold', fontSize:'1rem', color:'#1e293b'}}>{b.vehicleType}: {b.pickupLocation}</div>
            <div style={{marginTop:8}}>
                {b.status === "Pending" && <span style={{background:'#fef3c7', padding:'4px 10px', borderRadius:6, fontSize:'0.8rem', color:'#b45309'}}>⏳ Searching...</span>}
                {b.status === "Accepted" && (<div style={{background:'#dcfce7', padding:10, borderRadius:8, marginTop:5}}><div style={{color:'#166534', fontWeight:'bold'}}>✅ Driver: {b.driverName}</div><div style={{color:'#15803d'}}>Vehicle: {b.vehicleNumber}</div><div style={{marginTop:5, fontSize:'1.1rem', fontWeight:'bold', color:'#2563eb'}}>OTP: {b.otp}</div></div>)}
                {b.status === "In Progress" && <span style={{background:'#bfdbfe', padding:'4px 10px', borderRadius:6, fontSize:'0.8rem', fontWeight:'bold', color:'#1e40af'}}>🚀 ON THE WAY</span>}
                {b.status === "Completed" && <span style={{background:'#f0fdf4', padding:'4px 10px', borderRadius:6, fontSize:'0.8rem', fontWeight:'bold', color:'#15803d'}}>🏁 COMPLETED</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', fontSize: '1rem', outline:'none' };
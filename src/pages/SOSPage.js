import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function SOSPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("ACTIVATING"); // ACTIVATING -> SENT
  const [coords, setCoords] = useState(null);
  const [locationText, setLocationText] = useState("Fetching GPS...");

  // ⬇️ GET SAVED DATA
  const guardianPhone = localStorage.getItem("viz_guardian_phone") || "";
  const userName = localStorage.getItem("viz_user_name") || "I";

  // --- HELPER: OPEN WHATSAPP ---
  const triggerWhatsApp = (lat, long) => {
    if (!guardianPhone) return alert("No Guardian Number found! Please Login again.");

    // 1. Clean the number (remove spaces, +, -)
    let cleanNumber = guardianPhone.replace(/\D/g, ''); 
    // 2. Add India Code (+91) if missing
    if (cleanNumber.length === 10) cleanNumber = "91" + cleanNumber;

    // 3. Create Google Maps Link
    const mapLink = `https://www.google.com/maps?q=${lat},${long}`;
    
    // 4. Create Message
    const message = `🚨 EMERGENCY! \n${userName} needs help!\n\n📍 Location: ${mapLink}`;

    // 5. Open WhatsApp
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    
    setStatus("SENT");
  };

  useEffect(() => {
    // 1. Audio Alert
    const speak = (text) => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0; u.pitch = 1.2;
      window.speechSynthesis.speak(u);
    };

    speak(`Emergency Alert Activated. Sharing location with guardian.`);

    // 2. Get Real GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, long: longitude });
          setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        () => setLocationText("Unknown Location")
      );
    }

    // 3. COUNTDOWN TO AUTO-SEND (5 Seconds)
    const timer = setTimeout(() => {
      if (coords) {
        speak("Sending WhatsApp Alert Now.");
        triggerWhatsApp(coords.lat, coords.long);
      } else {
        // Fallback if GPS is slow
        speak("Sending Alert without precise GPS.");
        triggerWhatsApp(0, 0); 
      }
    }, 5000); // 5 Seconds delay

    return () => clearTimeout(timer);
  }, [coords]); // Dependencies

  return (
    <div className="app-container" style={{background: '#ef4444', justifyContent: 'center', textAlign: 'center'}}>
      
      {/* SIREN ANIMATION */}
      <div style={{fontSize: '5rem', marginBottom: 10, animation: 'pulse 1s infinite'}}>🚨</div>
      <h1 style={{color: 'white', fontSize: '2.5rem', margin: 0}}>EMERGENCY</h1>
      <p style={{color: '#fecaca', marginBottom: 30}}>SOS Mode Active</p>

      {/* STATUS CARD */}
      <div style={{background: 'rgba(0,0,0,0.2)', padding: 25, borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)'}}>
        <h2 style={{margin: 0, color: 'white'}}>
            {status === "ACTIVATING" ? "Auto-sending in 5s..." : "✅ OPENING WHATSAPP"}
        </h2>
        
        <div style={{marginTop: 15, color: 'white', textAlign: 'left', lineHeight: '1.6'}}>
            <strong>To:</strong> {guardianPhone || "Not Set"} <br/>
            <strong>Loc:</strong> {locationText}
        </div>
      </div>

      {/* MANUAL SEND BUTTON (In case auto fails) */}
      {status === "ACTIVATING" && coords && (
        <button 
          onClick={() => triggerWhatsApp(coords.lat, coords.long)}
          style={{
            marginTop: 20, padding: '15px 30px', width: '100%',
            background: '#22c55e', color: 'white', border: 'none', 
            borderRadius: 12, fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}
        >
          📤 SEND NOW
        </button>
      )}

      {/* CANCEL BUTTON */}
      <button 
        onClick={() => navigate("/home")} 
        style={{
          marginTop: 20, padding: '15px 30px', borderRadius: 50, 
          border: 'none', background: 'white', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer'
        }}
      >
        ❌ I AM SAFE (CANCEL)
      </button>

    </div>
  );
}
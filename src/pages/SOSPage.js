import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function SOSPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("ACTIVATING"); // ACTIVATING -> SENT
  const [coords, setCoords] = useState(null);
  const [locationText, setLocationText] = useState("Fetching GPS...");
  
  // Hidden link reference
  const whatsappLinkRef = useRef(null);

  // Session Data
  const guardianPhone = sessionStorage.getItem("viz_guardian_phone") || "";
  const userName = sessionStorage.getItem("viz_user_name") || "I";

  // --- HELPER: GENERATE URL ---
  const getWhatsAppUrl = (lat, long) => {
    if (!guardianPhone) return "";
    
    let cleanNumber = guardianPhone.replace(/\D/g, ''); 
    if (cleanNumber.length === 10) cleanNumber = "91" + cleanNumber;

    // Google Maps Link
    const mapLink = `http://maps.google.com/?q=${lat},${long}`;
    const message = `🚨 EMERGENCY! \n${userName} needs help!\n\n📍 Location: ${mapLink}`;

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  useEffect(() => {
    const speak = (text) => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0; u.pitch = 1.2;
      window.speechSynthesis.speak(u);
    };

    speak(`Emergency Alert Activated. Sharing location.`);

    // 1. GET GPS
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

    // 2. AUTO-CLICK TIMER (5 Seconds)
    const timer = setTimeout(() => {
        if(whatsappLinkRef.current) {
            speak("Opening WhatsApp now.");
            // ⚡ THE TRICK: Programmatically click the hidden link
            whatsappLinkRef.current.click(); 
            setStatus("SENT");
        }
    }, 5000); 

    return () => clearTimeout(timer);
  }, []); 

  return (
    <div className="app-container" style={{background: '#ef4444', justifyContent: 'center', textAlign: 'center'}}>
      
      <div style={{fontSize: '5rem', marginBottom: 10, animation: 'pulse 1s infinite'}}>🚨</div>
      <h1 style={{color: 'white', fontSize: '2.5rem', margin: 0}}>EMERGENCY</h1>
      <p style={{color: '#fecaca', marginBottom: 30}}>SOS Mode Active</p>

      <div style={{background: 'rgba(0,0,0,0.2)', padding: 25, borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)'}}>
        <h2 style={{margin: 0, color: 'white'}}>
            {status === "ACTIVATING" ? "Redirecting in 5s..." : "✅ OPENING..."}
        </h2>
        <div style={{marginTop: 15, color: 'white', textAlign: 'left'}}>
            <strong>To:</strong> {guardianPhone || "Not Set"} <br/>
            <strong>Loc:</strong> {locationText}
        </div>
      </div>

      {/* 🕵️ HIDDEN LINK FOR AUTO-CLICK */}
      <a 
          ref={whatsappLinkRef}
          href={coords ? getWhatsAppUrl(coords.lat, coords.long) : getWhatsAppUrl(0, 0)}
          style={{display: 'none'}}
          target="_blank"
          rel="noopener noreferrer"
      >
          Hidden Auto Link
      </a>

      {/* FALLBACK BUTTON */}
      <button 
          onClick={() => whatsappLinkRef.current.click()}
          style={{
            marginTop: 20, padding: '20px 30px', width: '100%',
            background: 'white', color: '#dc2626', border: 'none', 
            borderRadius: 12, fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}
        >
          📤 CLICK IF NOT OPENING
        </button>

      <button 
        onClick={() => navigate("/home")} 
        style={{marginTop: 20, padding: '15px 30px', borderRadius: 50, border: '2px solid white', background: 'transparent', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}
      >
        ❌ CANCEL
      </button>

    </div>
  );
}
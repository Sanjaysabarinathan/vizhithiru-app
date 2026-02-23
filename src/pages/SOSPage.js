import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function SOSPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("ACTIVATING");
  const [coords, setCoords] = useState(null);
  const [locationText, setLocationText] = useState("Fetching GPS...");

  const whatsappLinkRef = useRef(null);

  const guardianPhone = sessionStorage.getItem("viz_guardian_phone") || "";
  const userName = sessionStorage.getItem("viz_user_name") || "I";

  const getWhatsAppUrl = (lat, long) => {
    if (!guardianPhone) return "";
    let cleanNumber = guardianPhone.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = "91" + cleanNumber;

    const mapLink = `https://www.google.com/maps?q=${lat},${long}`;
    const message = `🚨 EMERGENCY! \n${userName} needs help!\n\n📍 Location: ${mapLink}`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  useEffect(() => {
    const speak = (text) => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(u);
    };

    speak("Emergency Alert Activated. Sharing your location in five seconds.");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, long: longitude });
          setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        () => setLocationText("GPS Error")
      );
    }

    const timer = setTimeout(async () => {
      if (whatsappLinkRef.current) {
        speak("Opening WhatsApp and initiating emergency call.");

        // SOS 2.0: Trigger Twilio Call via Backend
        try {
          await fetch('http://127.0.0.1:5000/api/sos/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: guardianPhone, name: userName })
          });
        } catch (e) { console.error("Twilio Trigger Failed", e); }

        whatsappLinkRef.current.click();
        setStatus("SENT");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container}>
      {/* ANIMATED BACKGROUND RING */}
      <div style={styles.pulseRing}></div>

      <div style={styles.content}>
        <div style={styles.icon}>🚨</div>
        <h1 style={styles.title}>EMERGENCY</h1>
        <p style={styles.subtitle}>Alerting your guardian immediately</p>

        <div style={styles.statusBox}>
          <div style={styles.statusRow}>
            <span style={styles.label}>Guardian:</span>
            <span style={styles.value}>{guardianPhone || "Not Set"}</span>
          </div>
          <div style={styles.statusRow}>
            <span style={styles.label}>Location:</span>
            <span style={styles.value}>{locationText}</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: status === "SENT" ? "100%" : "50%" }}></div>
          </div>
          <p style={styles.statusText}>
            {status === "ACTIVATING" ? "Redirecting to WhatsApp..." : "✅ Redirect Triggered"}
          </p>
        </div>

        {/* HIDDEN LINK */}
        <a
          ref={whatsappLinkRef}
          href={coords ? getWhatsAppUrl(coords.lat, coords.long) : "#"}
          style={{ display: 'none' }}
          target="_blank"
          rel="noopener noreferrer"
        >Link</a>

        <button onClick={() => navigate("/home")} style={styles.cancelBtn}>
          ❌ CANCEL ALERT
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    background: '#7f1d1d', // Deep red
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontFamily: 'system-ui',
    overflow: 'hidden',
    position: 'relative'
  },
  content: {
    textAlign: 'center',
    zIndex: 2,
    padding: '20px',
    width: '100%',
    maxWidth: '400px'
  },
  pulseRing: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'rgba(239, 68, 68, 0.4)',
    animation: 'pulse-red 2s infinite'
  },
  icon: { fontSize: '5rem', marginBottom: '10px' },
  title: { fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '2px' },
  subtitle: { opacity: 0.8, marginBottom: '40px' },
  statusBox: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '24px',
    padding: '25px',
    textAlign: 'left',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  statusRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  label: { color: '#fca5a5', fontWeight: 'bold' },
  value: { fontWeight: '500' },
  progressBar: {
    height: '8px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '10px',
    marginTop: '20px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#ef4444',
    transition: 'width 5s linear'
  },
  statusText: { textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', fontWeight: 'bold' },
  cancelBtn: {
    marginTop: '40px',
    background: 'white',
    color: '#7f1d1d',
    border: 'none',
    padding: '15px 40px',
    borderRadius: '50px',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 10px 15px rgba(0,0,0,0.2)'
  }
};
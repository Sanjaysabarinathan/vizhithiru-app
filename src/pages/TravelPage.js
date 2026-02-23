import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const DICTIONARY = {
  en: {
    welcome: "Select a vehicle",
    searching: "Searching for driver...",
    pickup: "Pickup Location",
    drop: "Drop Location",
    askPickup: "Where should we pick you up?",
    askDrop: "Where do you want to go?",
    confirm: "Confirm Booking",
    listening: "Listening...",
    langBtn: "🇮🇳 Tamil",
    auto: "Auto",
    bike: "Bike",
    bus: "Bus",
    clear: "Clear",
    historyCleared: "History cleared"
  },
  ta: {
    welcome: "வாகனத்தைத் தேர்ந்தெடுக்கவும்",
    searching: "டிரைவரைத் தேடுகிறோம்...",
    pickup: "ஏறிக்கொள்ளும் இடம்",
    drop: "இறங்கும் இடம்",
    askPickup: "உங்களை எங்கிருந்து அழைத்துச் செல்ல வேண்டும்?",
    askDrop: "நீங்கள் எங்கு செல்ல வேண்டும்?",
    confirm: "முன்பதிவை உறுதி செய்",
    listening: "கவனிக்கிறது...",
    langBtn: "🇬🇧 English",
    auto: "ஆட்டோ",
    bike: "பைக்",
    bus: "பேருந்து",
    clear: "அழி",
    historyCleared: "வரலாறு அழிக்கப்பட்டது"
  }
};

export default function TravelPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState("en");
  const [status, setStatus] = useState("IDLE");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pickupLoc, setPickupLoc] = useState("");
  const [dropLoc, setDropLoc] = useState("");
  const [bookings, setBookings] = useState([]);
  const [activeRide, setActiveRide] = useState(null);

  const userName = sessionStorage.getItem("viz_user_name") || "User";
  const userPhone = sessionStorage.getItem("viz_guardian_phone");
  const recognitionRef = useRef(null);

  const t = useCallback((key) => DICTIONARY[lang][key] || key, [lang]);

  const fetchActiveRide = useCallback(async () => {
    if (!userPhone) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/ride/active-user/${userPhone}`);
      const data = await res.json();
      if (data.success) setActiveRide(data.ride);
    } catch (e) { console.error("Active Ride Fetch Error", e); }
  }, [userPhone]);

  // --- HELPER: FETCH RIDE HISTORY ---
  const fetchHistory = useCallback(async () => {
    if (!userPhone) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/ride/history/${userPhone}`);
      const data = await res.json();
      if (data.success) setBookings(data.history);
    } catch (e) { console.error("History Error", e); }
  }, [userPhone]);

  // --- ACTION: CLEAR HISTORY ---
  const clearHistory = async () => {
    if (!window.confirm(lang === "en" ? "Delete history?" : "வரலாற்றை அழிக்கவா?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/ride/clear/${userPhone}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBookings([]);
        const msg = new SpeechSynthesisUtterance(t('historyCleared'));
        msg.lang = lang === "en" ? "en-IN" : "ta-IN";
        window.speechSynthesis.speak(msg);
      }
    } catch (e) { alert("Failed to clear history"); }
  };

  useEffect(() => {
    fetchHistory();
    fetchActiveRide();

    // Auto refresh active ride status
    const interval = setInterval(() => {
      fetchHistory();
      fetchActiveRide();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory, fetchActiveRide]);

  const startVoiceInput = (field) => {
    if (status === "LISTENING") return;
    window.speechSynthesis.cancel();
    const text = field === "pickup" ? t('askPickup') : t('askDrop');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "en" ? "en-IN" : "ta-IN";
    u.onend = () => {
      if (recognitionRef.current) {
        try {
          setStatus("LISTENING");
          recognitionRef.current.start();
          recognitionRef.current.onresult = (e) => {
            const result = e.results[0][0].transcript;
            if (field === "pickup") setPickupLoc(result);
            else setDropLoc(result);
            setStatus("IDLE");
          };
          recognitionRef.current.onend = () => setStatus("IDLE");
        } catch (err) { console.log("Mic Busy"); }
      }
    };
    window.speechSynthesis.speak(u);
  };

  const handleVehicleSelection = (v) => {
    setSelectedVehicle(v);
    window.speechSynthesis.cancel();
    const vehicleName = t(v.toLowerCase());
    const msg = new SpeechSynthesisUtterance(vehicleName);
    msg.lang = lang === "en" ? "en-IN" : "ta-IN";
    window.speechSynthesis.speak(msg);
  };

  const finalizeBooking = async () => {
    if (!pickupLoc || !dropLoc) return alert("Please enter locations!");
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setStatus("SEARCHING");
    try {
      const response = await fetch('http://127.0.0.1:5000/api/ride/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderName: userName, riderPhone: userPhone,
          vehicleType: selectedVehicle, pickupLocation: `${pickupLoc} ➡️ ${dropLoc}`,
          otp: newOtp
        })
      });
      const data = await response.json();
      if (data.success) {
        const confirmationText = lang === "en"
          ? `Booking confirmed for ${selectedVehicle}. Price is ${data.fare} rupees. Your O T P is ${newOtp.split('').join(' ')}.`
          : `${t(selectedVehicle.toLowerCase())} முன்பதிவு செய்யப்பட்டது. விலை ${data.fare} ரூபாய். உங்கள் ஓ டி பி ${newOtp.split('').join(' ')}.`;

        const msg = new SpeechSynthesisUtterance(confirmationText);
        msg.lang = lang === "en" ? "en-IN" : "ta-IN";
        window.speechSynthesis.speak(msg);

        alert(`✅ Booking Sent!\nFare: ₹${data.fare}\nOTP: ${newOtp}`);
        setSelectedVehicle(null);
        setPickupLoc(""); setDropLoc("");
        fetchActiveRide();
        fetchHistory();
      }
    } catch (e) { console.error(e); }
    setStatus("IDLE");
  };

  const toggleLang = () => {
    const newLang = lang === "en" ? "ta" : "en";
    setLang(newLang);
    localStorage.setItem("viz_app_lang", newLang);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("viz_app_lang") || "en";
    setLang(savedLang);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = savedLang === "en" ? "en-IN" : "ta-IN";
      recognitionRef.current = rec;
    }
  }, [lang]);

  return (
    <div className="app-container" style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => navigate("/home")} style={backBtnStyle}>⬅ Home</button>
        <button onClick={toggleLang} style={langBtnStyle}>{t('langBtn')}</button>
      </header>

      <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', textAlign: 'center' }}>{t('welcome')}</h2>

      {/* ACTIVE RIDE SECTION */}
      {activeRide && (
        <div style={{ background: '#2563eb', color: 'white', padding: 20, borderRadius: 24, marginBottom: 25, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ background: '#3b82f6', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 'bold' }}>ACTIVE RIDE</span>
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>₹{activeRide.fare}</span>
          </div>
          <h3 style={{ margin: '5px 0' }}>{activeRide.driverName || t('searching')}</h3>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{activeRide.pickupLocation}</div>

          <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>STATUS</div>
              <div style={{ fontWeight: 'bold' }}>{activeRide.status.toUpperCase()}</div>
            </div>
            {activeRide.status !== "In Progress" && (
              <div style={{ background: 'white', color: '#2563eb', padding: '10px 20px', borderRadius: 15, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', marginBottom: 4 }}>OTP</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: 2 }}>{activeRide.otp}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 30 }}>
        {['Auto', 'Bike', 'Bus'].map(v => (
          <div
            key={v}
            onClick={() => handleVehicleSelection(v)}
            style={{
              padding: '20px 10px', borderRadius: 20, textAlign: 'center', cursor: 'pointer',
              background: selectedVehicle === v ? '#2563eb' : 'white',
              color: selectedVehicle === v ? 'white' : '#1e293b',
              border: '2px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ fontSize: '2.5rem' }}>{v === 'Auto' ? '🛺' : v === 'Bike' ? '🏍️' : '🚌'}</div>
            <div style={{ fontWeight: 'bold', marginTop: 5 }}>{t(v.toLowerCase())}</div>
          </div>
        ))}
      </div>

      {selectedVehicle && (
        <div style={{ background: 'white', padding: 25, borderRadius: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📍 Book {t(selectedVehicle.toLowerCase())}</h3>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>🟢 {t('pickup')}</label>
            <input
              type="text"
              placeholder={t('askPickup')}
              value={pickupLoc}
              onFocus={() => startVoiceInput("pickup")}
              onChange={(e) => setPickupLoc(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 25 }}>
            <label style={labelStyle}>🔴 {t('drop')}</label>
            <input
              type="text"
              placeholder={t('askDrop')}
              value={dropLoc}
              onFocus={() => startVoiceInput("drop")}
              onChange={(e) => setDropLoc(e.target.value)}
              style={inputStyle}
            />
          </div>

          {status === "LISTENING" && (
            <div style={{ textAlign: 'center', color: '#ef4444', fontWeight: 'bold', marginBottom: 15 }}>
              🎤 {t('listening')}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setSelectedVehicle(null)} style={{ flex: 1, padding: '15px', border: 'none', borderRadius: 15, background: '#fee2e2', color: '#ef4444' }}>Cancel</button>
            <button onClick={finalizeBooking} style={{ ...bookBtnStyle, flex: 2 }}>
              {status === "SEARCHING" ? "..." : t('confirm')}
            </button>
          </div>
        </div>
      )}

      {/* RECENT RIDES HISTORY WITH CLEAR OPTION */}
      <div style={{ marginTop: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ color: '#475569', margin: 0 }}>Recent Rides</h3>
          {bookings.length > 0 && (
            <button onClick={clearHistory} style={clearBtnStyle}>🗑️ {t('clear')}</button>
          )}
        </div>
        {bookings.length === 0 && <p style={{ color: '#94a3b8' }}>No recent rides found.</p>}
        {bookings.slice(0, 3).map(b => (
          <div key={b._id} style={{ background: 'white', padding: 15, borderRadius: 15, marginBottom: 10, borderLeft: '5px solid #3b82f6', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 'bold' }}>{b.vehicleType} • {b.status}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{b.pickupLocation}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const backBtnStyle = { background: '#fff', border: '1px solid #e2e8f0', padding: '8px 15px', borderRadius: '12px', cursor: 'pointer' };
const langBtnStyle = { background: '#f1f5f9', border: 'none', padding: '8px 15px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem' };
const clearBtnStyle = { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' };
const labelStyle = { display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#64748b', fontSize: '0.9rem' };
const inputStyle = { width: '100%', padding: '18px', borderRadius: '15px', border: '2px solid #e2e8f0', fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' };
const bookBtnStyle = { padding: '15px', borderRadius: '15px', background: '#22c55e', color: 'white', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' };
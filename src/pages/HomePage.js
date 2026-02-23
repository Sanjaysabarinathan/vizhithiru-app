import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const DICTIONARY = {
  en: {
    hello: "Hello,",
    sos: "Emergency SOS",
    sosDesc: "Alert Guardian immediately",
    travel: "Travel Assistant",
    travelDesc: "Book Auto, Bike, Bus",
    maps: "Maps & Nav",
    mapsDesc: "Find your way",
    aiVision: "AI Vision Assistant",
    aiVisionDesc: "Identify your vehicle",
    vision: "Accessibility Tools",
    logout: "Logout",
    langBtn: "🇮🇳 Tamil",
    replay: "🔊 Replay Welcome",
    locating: "Locating you...",
    currentAt: "You are currently at ",
    interestFound: "Nearby point detected: ",
    shakeTip: "Shake to hear your address"
  },
  ta: {
    hello: "வணக்கம்,",
    sos: "அவசர உதவி",
    sosDesc: "பாதுகாவலருக்குத் தகவல் அனுப்பு",
    travel: "பயண உதவியாளர்",
    travelDesc: "ஆட்டோ, பைக் மற்றும் பேருந்து",
    maps: "வரைபடம்",
    mapsDesc: "வழியைத் தேடுங்கள்",
    aiVision: "AI விஷன் அசிஸ்டண்ட்",
    aiVisionDesc: "வாகனத்தைக் கண்டறியவும்",
    vision: "அணுகல் கருவிகள்",
    logout: "வெளியேறு",
    langBtn: "🇬🇧 English",
    replay: "🔊 வரவேற்பு",
    locating: "உங்கள் இருப்பிடத்தைத் தேடுகிறது...",
    currentAt: "நீங்கள் தற்போது இருக்கும் இடம் ",
    interestFound: "அருகிலுள்ள இடம்: ",
    shakeTip: "முகவரியைக் கேட்க மொபைலைக் குலுக்கவும்"
  }
};

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Traveller");
  const [lang, setLang] = useState("en");

  // --- 1. TRANSLATION HELPER (Wrapped in useCallback to fix ESLint) ---
  const t = useCallback((key) => DICTIONARY[lang][key], [lang]);

  // --- 2. NEARBY INTERESTS (Wrapped in useCallback to fix ESLint) ---
  const fetchNearbyInterests = useCallback(async (lat, lon) => {
    const query = `[out:json];(node["amenity"~"atm|pharmacy|hospital"](around:200, ${lat}, ${lon});node["highway"="bus_stop"](around:200, ${lat}, ${lon}););out body;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.elements && data.elements.length > 0) {
        const name = data.elements[0].tags.name || data.elements[0].tags.amenity || "Facility";
        const speech = new SpeechSynthesisUtterance(`${t('interestFound')} ${name}`);
        speech.lang = lang === "en" ? "en-IN" : "ta-IN";
        window.speechSynthesis.speak(speech);
      }
    } catch (e) { console.error(e); }
  }, [lang, t]);

  // --- 3. BLINDSQUARE LOGIC: ANNOUNCE ADDRESS ---
  const announceLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    window.speechSynthesis.cancel();
    const startMsg = new SpeechSynthesisUtterance(t('locating'));
    startMsg.lang = lang === "en" ? "en-IN" : "ta-IN";
    window.speechSynthesis.speak(startMsg);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const address = data.display_name.split(",").slice(0, 3).join(",");
        const msg = new SpeechSynthesisUtterance(`${t('currentAt')} ${address}`);
        msg.lang = lang === "en" ? "en-IN" : "ta-IN";
        window.speechSynthesis.speak(msg);

        fetchNearbyInterests(latitude, longitude);
      } catch (e) { console.error(e); }
    });
  }, [lang, t, fetchNearbyInterests]);

  // --- 4. SHAKE DETECTION ---
  useEffect(() => {
    let lastX, lastY;
    const threshold = 15;
    const handleMotion = (e) => {
      const { x, y } = e.accelerationIncludingGravity;
      if (!lastX) { lastX = x; lastY = y; return; }
      if (Math.abs(lastX - x) > threshold && Math.abs(lastY - y) > threshold) {
        announceLocation();
      }
      lastX = x; lastY = y;
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [announceLocation]);

  // --- 5. AUTH & WELCOME ---
  useEffect(() => {
    const storedName = sessionStorage.getItem("viz_user_name");
    if (storedName) setUserName(storedName); else navigate("/");
    const savedLang = localStorage.getItem("viz_app_lang");
    if (savedLang) setLang(savedLang);
  }, [navigate]);

  const speakWelcome = useCallback(() => {
    window.speechSynthesis.cancel();
    const text = lang === "en" ? `Hello ${userName}, Welcome to Vizhithiru.` : `Vanakkam ${userName}, Vizhithiru-vuku varaverkirom.`;
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = lang === "en" ? "en-IN" : "ta-IN";
    window.speechSynthesis.speak(msg);
  }, [lang, userName]);

  useEffect(() => {
    if (userName !== "Traveller") {
      const timer = setTimeout(() => speakWelcome(), 500);
      return () => clearTimeout(timer);
    }
  }, [userName, lang, speakWelcome]);

  const toggleLang = () => {
    const newLang = lang === "en" ? "ta" : "en";
    setLang(newLang);
    localStorage.setItem("viz_app_lang", newLang);
  };

  return (
    <div className="app-container" style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.greeting}>{t('hello')}</h1>
          <h2 style={styles.userName}>{userName} 👋</h2>
        </div>
        <div style={styles.topActions}>
          <button onClick={toggleLang} style={styles.langBadge}>{t('langBtn')}</button>
          <button onClick={() => { sessionStorage.clear(); navigate("/"); }} style={styles.logoutIcon}>🚪</button>
        </div>
      </header>

      {/* EMERGENCY SECTION */}
      <div onClick={() => navigate("/sos")} style={styles.sosStrip}>
        <div style={styles.sosPulse}>🚨</div>
        <div>
          <h3 style={styles.sosTitle}>{t('sos')}</h3>
          <p style={styles.sosSubtitle}>{t('sosDesc')}</p>
        </div>
      </div>

      {/* FEATURE STACK */}
      <div style={styles.cardStack}>
        <div onClick={() => navigate("/travel")} style={{ ...styles.mainCard, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
          <div style={styles.cardInfo}><h3 style={styles.cardTitle}>{t('travel')}</h3><p style={styles.cardDesc}>{t('travelDesc')}</p></div>
          <div style={styles.cardIcon}>🚕</div>
        </div>

        <div onClick={() => navigate("/map")} style={{ ...styles.mainCard, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          <div style={styles.cardInfo}><h3 style={styles.cardTitle}>{t('maps')}</h3><p style={styles.cardDesc}>{t('mapsDesc')}</p></div>
          <div style={styles.cardIcon}>📍</div>
        </div>

        <div onClick={() => navigate("/vision")} style={{ ...styles.mainCard, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
          <div style={styles.cardInfo}><h3 style={styles.cardTitle}>{t('aiVision')}</h3><p style={styles.cardDesc}>{t('aiVisionDesc')}</p></div>
          <div style={styles.cardIcon}>👁️</div>
        </div>
      </div>

      {/* UTILITY TOOLS */}
      <h3 style={styles.sectionLabel}>{t('vision')}</h3>
      <div style={styles.toolkitGrid}>
        <div onClick={() => navigate("/talkback")} style={styles.toolItem}><span>📢</span>TalkBack</div>
        <div onClick={() => navigate("/stt")} style={styles.toolItem}><span>🎤</span>STT</div>
        <div onClick={() => navigate("/tts")} style={styles.toolItem}><span>🗣️</span>TTS</div>
        <div onClick={() => navigate("/zoom")} style={styles.toolItem}><span>🔍</span>Zoom</div>
      </div>

      <div style={styles.footer}>
        <button onClick={speakWelcome} style={styles.replayBtn}>{t('replay')}</button>
        <p style={styles.shakeTip}>📳 {t('shakeTip')}</p>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px' },
  greeting: { fontSize: '1.2rem', color: '#64748b', margin: 0 },
  userName: { fontSize: '2rem', color: '#0f172a', margin: 0, fontWeight: '800' },
  topActions: { display: 'flex', gap: '10px', alignItems: 'center' },
  langBadge: { background: '#fff', border: '1px solid #e2e8f0', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer' },
  logoutIcon: { background: '#fee2e2', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' },
  sosStrip: { background: '#ef4444', color: 'white', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)', cursor: 'pointer' },
  sosPulse: { fontSize: '2.5rem' },
  sosTitle: { margin: 0, fontSize: '1.4rem', fontWeight: 'bold' },
  sosSubtitle: { margin: 0, opacity: 0.9, fontSize: '0.9rem' },
  cardStack: { display: 'flex', flexDirection: 'column', gap: '15px' },
  mainCard: { borderRadius: '24px', padding: '25px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', cursor: 'pointer' },
  cardTitle: { margin: 0, fontSize: '1.5rem', fontWeight: 'bold' },
  cardDesc: { margin: '5px 0 0 0', opacity: 0.8, fontSize: '0.9rem' },
  cardIcon: { fontSize: '3rem', opacity: 0.5 },
  sectionLabel: { marginTop: '30px', color: '#475569', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' },
  toolkitGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' },
  toolItem: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '15px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize: '0.7rem', fontWeight: 'bold', color: '#475569', textAlign: 'center', cursor: 'pointer' },
  footer: { marginTop: '40px', textAlign: 'center' },
  replayBtn: { background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer' },
  shakeTip: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '10px' }
};
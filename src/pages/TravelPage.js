import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import "../App.css"; 

// --- CONSTANTS ---
const DRIVERS = ["Ravi", "Kumar", "Senthil", "Mani"];
const BUSES = ["70A", "12B", "Town Bus 42"];
const TRAINS = ["Cheran Express", "Kovai Express"];

const DICTIONARY = {
  en: { 
    welcome: "Tap mic to start", 
    where: "Where to go ?", 
    fare: "Your total Fare is", 
    rupees: "rupees. Confirm?", 
    confirm: "Confirmed.", 
    cancel: "Cancelled.", 
    otp: "OTP", 
    mapBtn: "View Map" 
  },
  ta: { 
    welcome: "Pesuvatharku azhuthavum", 
    where: "Enga poga venum?", 
    fare: "Kattanam", 
    rupees: "rubai. Confirm-a?", 
    confirm: "Urudhi aayirru.", 
    cancel: "Ratthu.", 
    otp: "OTP", 
    mapBtn: "Vazhiyai Paar" 
  }
};

export default function TravelPage() {
  const navigate = useNavigate(); 
  
  // --- STATE ---
  const [lang, setLang] = useState("en"); 
  const [status, setStatus] = useState("IDLE"); 
  const [assistantMsg, setAssistantMsg] = useState(DICTIONARY.en.welcome);
  const [transcript, setTranscript] = useState("");
  
  // Load History
  const [bookings, setBookings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vizhithiru_bookings")) || []; } catch { return []; }
  });
  useEffect(() => localStorage.setItem("vizhithiru_bookings", JSON.stringify(bookings)), [bookings]);

  const activeFlowRef = useRef(null);
  const tempDataRef = useRef({});
  const recognitionRef = useRef(null);
  const t = (key) => DICTIONARY[lang][key] || key;

  // --- AUDIO LOGIC ---
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang === "en" ? "en-IN" : "ta-IN"; 
    rec.onstart = () => setStatus("LISTENING");
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      handleIntent(text);
    };
    rec.onend = () => setStatus("IDLE");
    recognitionRef.current = rec;
  }, [lang]); 

  const speak = (text) => {
    setStatus("SPEAKING");
    setAssistantMsg(text);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "en" ? "en-IN" : "ta-IN";
    u.onend = () => { setStatus("IDLE"); if (activeFlowRef.current) setTimeout(startListening, 300); };
    window.speechSynthesis.speak(u);
  };

  const startListening = () => { try { recognitionRef.current.start(); } catch(e) {} };

  const startBooking = (type) => {
    activeFlowRef.current = type;
    tempDataRef.current = {}; 
    speak(`${type.toUpperCase()} Booking. ${t('where')}`);
  };

  const handleIntent = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("cancel")) { activeFlowRef.current = null; return speak(t('cancel')); }
    
    if (activeFlowRef.current) {
      if (tempDataRef.current.destination) {
        if (lower.includes("yes") || lower.includes("confirm") || lower.includes("ok")) finalizeBooking();
        else { activeFlowRef.current = null; speak(t('cancel')); }
      } else {
        tempDataRef.current = { destination: text };
        speak(`${t('fare')} ${activeFlowRef.current === 'bike' ? 45 : 150} ${t('rupees')}`);
      }
      return;
    }
    if (lower.includes("bike")) return startBooking("bike");
    if (lower.includes("bus")) return startBooking("bus");
    if (lower.includes("train")) return startBooking("train");
    speak(DICTIONARY[lang].error || "Again?");
  };

  const finalizeBooking = () => {
    const type = activeFlowRef.current;
    const detail = type === 'bike' ? `Driver: ${DRIVERS[0]}` : type === 'bus' ? `Bus: ${BUSES[0]}` : `Train: ${TRAINS[0]}`;
    const newBooking = { id: Date.now(), type, dest: tempDataRef.current.destination, otp: Math.floor(Math.random()*9000)+1000, time: new Date().toLocaleTimeString(), detail };
    setBookings(prev => [newBooking, ...prev]); 
    activeFlowRef.current = null;
    speak(`${t('confirm')} ${t('otp')} ${newBooking.otp}`);
  };

  // --- NEW UI (This matches App.css) ---
  return (
    <div className="app-container">
      
      {/* 1. HEADER */}
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <button onClick={() => navigate("/")} className="back-btn">⬅ Home</button>
        <button onClick={() => setLang(lang === "en" ? "ta" : "en")} className="app-btn btn-slate" style={{padding:'5px 15px', fontSize:'0.8rem'}}>
          {lang === "en" ? "🇮🇳 Tamil" : "🇬🇧 English"}
        </button>
      </div>

      {/* 2. VOICE STATUS CARD */}
      <div className="status-card">
        <div className={`mic-icon ${status !== "IDLE" ? "active" : ""}`} onClick={startListening}>
          {status === "SPEAKING" ? "🔊" : status === "LISTENING" ? "🎤" : "🤖"}
        </div>
        <h3 style={{margin: "10px 0"}}>{assistantMsg}</h3>
        <p style={{color:'var(--secondary)', margin:0}}>{transcript || "Listening..."}</p>
      </div>

      {/* 3. COLORFUL BUTTONS */}
      <div className="btn-grid" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
        <button className="app-btn btn-amber" onClick={() => startBooking("bike")}>
            <span style={{fontSize:'1.5rem', marginBottom:5}}>🛵</span>
            Bike
        </button>
        <button className="app-btn btn-green" onClick={() => startBooking("bus")}>
            <span style={{fontSize:'1.5rem', marginBottom:5}}>🚌</span>
            Bus
        </button>
        <button className="app-btn btn-blue" onClick={() => startBooking("train")}>
            <span style={{fontSize:'1.5rem', marginBottom:5}}>🚆</span>
            Train
        </button>
      </div>

      {/* 4. BOOKING HISTORY */}
      <div style={{padding: 20}}>
        <h3 style={{color:'var(--text-dark)', marginBottom: 15}}>Recent Bookings</h3>
        
        {bookings.length === 0 && <p style={{color:'#94a3b8', textAlign:'center'}}>No bookings yet.</p>}

        {bookings.map((b) => (
          <div key={b.id} style={{
              background:'white', 
              padding:15, 
              borderRadius:16, 
              marginBottom:10, 
              boxShadow:'0 2px 5px rgba(0,0,0,0.05)', 
              borderLeft:`5px solid var(--primary)`
          }}>
            <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', marginBottom:5}}>
               <span>{b.type.toUpperCase()}</span>
               <span style={{color:'var(--secondary)', fontWeight:'normal', fontSize:'0.9rem'}}>{b.time}</span>
            </div>
            
            <div style={{color:'var(--text-dark)'}}>
                {b.detail} <br/> 
                <span style={{color:'var(--secondary)'}}>To: {b.dest}</span>
            </div>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, paddingTop:10, borderTop:'1px solid #f1f5f9'}}>
               <span style={{color:'var(--accent)', fontWeight:'bold'}}>OTP: {b.otp}</span>
               <button 
                 onClick={() => navigate("/map", { state: { dest: b.dest } })} 
                 style={{background:'#e0f2fe', color:'#0284c7', border:'none', padding:'8px 15px', borderRadius:8, cursor:'pointer', fontWeight:'600'}}>
                 🗺️ Map
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
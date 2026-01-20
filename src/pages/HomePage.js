import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css"; 

// 🗣️ TRANSLATION DICTIONARY
const DICTIONARY = {
  en: { 
    hello: "Hello,", 
    welcome: "Welcome to Vilithiru",
    sos: "Emergency SOS",
    sosDesc: "Alert Guardian immediately",
    travel: "Travel Assistant",
    travelDesc: "Book Auto, Bike, Bus",
    maps: "Maps & Nav",
    mapsDesc: "Find your way",
    vision: "Vision Tools",
    visionDesc: "TalkBack, STT, TTS, Zoom",
    logout: "Logout",
    langBtn: "🇮🇳 Tamil",
    replay: "🔊 Replay Welcome"
  },
  ta: { 
    hello: "Vanakkam,", 
    welcome: "Vizhithiru-vuku varaverkirom",
    sos: "Avasara Udhavi",
    sosDesc: "Udanae Guardian-ai azhai",
    travel: "Payana Udhavi",
    travelDesc: "Auto, Bike, Bus booking",
    maps: "Varaipadam",
    mapsDesc: "Vazhi kandupidi",
    vision: "Paarvai Karuvigal",
    visionDesc: "Pechu, Ezhuthu, Zoom",
    logout: "Veliyeru",
    langBtn: "🇬🇧 English",
    replay: "🔊 Varaverpu"
  }
};

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Traveller");
  const [lang, setLang] = useState("en"); 

  // --- 1. LOAD USER & LANGUAGE ---
  useEffect(() => {
    // Read from Session Storage (Fixes Rahul/Kajal issue)
    const storedName = sessionStorage.getItem("viz_user_name");
    if (storedName) {
      setUserName(storedName);
    } else {
      navigate("/"); // Kick out if not logged in
    }

    const savedLang = localStorage.getItem("viz_app_lang");
    if(savedLang) setLang(savedLang);

  }, [navigate]);

  // --- 2. TRANSLATION HELPER ---
  const t = (key) => DICTIONARY[lang][key];

  // --- 3. VOICE WELCOME ---
  const speakWelcome = useCallback(() => {
    window.speechSynthesis.cancel();
    const text = lang === "en" 
      ? `Hello ${userName}, Welcome to Vizhithiru.` 
      : `Vanakkam ${userName}, Vizhithiru-vuku varaverkirom.`;
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = lang === "en" ? "en-IN" : "ta-IN";
    window.speechSynthesis.speak(msg);
  }, [lang, userName]);

  useEffect(() => {
    if(userName !== "Traveller") {
        const timer = setTimeout(() => speakWelcome(), 500);
        return () => clearTimeout(timer);
    }
  }, [userName, lang, speakWelcome]);

  // --- 4. ACTIONS ---
  const toggleLang = () => {
      const newLang = lang === "en" ? "ta" : "en";
      setLang(newLang);
      localStorage.setItem("viz_app_lang", newLang);
  };

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to logout?")) {
        sessionStorage.clear();
        navigate("/");
    }
  };

  return (
    <div className="app-container" style={{padding: 30, justifyContent: 'center'}}>
      
      {/* HEADER SECTION */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 30}}>
        <div>
           <h1 style={{fontSize: '2rem', color: '#64748b', margin: 0}}>{t('hello')}</h1>
           <h2 style={{fontSize: '2.2rem', color: '#2563eb', margin: 0, textTransform:'capitalize'}}>{userName} 👋</h2>
        </div>
        
        <div style={{display:'flex', flexDirection:'column', gap:10, alignItems:'flex-end'}}>
            <button onClick={handleLogout} style={{background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: 8, cursor: 'pointer', fontWeight:'bold', fontSize:'0.9rem'}}>
              {t('logout')}
            </button>
            <button onClick={toggleLang} style={{background: '#e2e8f0', color: '#334155', border: 'none', padding: '8px 15px', borderRadius: 8, cursor: 'pointer', fontSize:'0.8rem'}}>
              {t('langBtn')}
            </button>
        </div>
      </div>

      {/* MAIN MENU GRID */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15}}>
        
        {/* 🚨 SOS (Full Width) */}
        <div onClick={() => navigate("/sos")} className="home-card" style={{background: '#fee2e2', border: '2px solid #dc2626', gridColumn: 'span 2', display:'flex', alignItems:'center', justifyContent:'center', gap: 20, padding: 20}}>
           <div style={{fontSize: '3rem'}}>🚨</div>
           <div style={{textAlign:'left'}}>
               <h3 style={{margin:0, color:'#991b1b', fontSize:'1.4rem'}}>{t('sos')}</h3>
               <p style={{margin:0, color:'#ef4444', fontSize:'0.9rem'}}>{t('sosDesc')}</p>
           </div>
        </div>

        {/* 🚕 TRAVEL */}
        <div onClick={() => navigate("/travel")} className="home-card" style={{background: '#dbeafe', border: '2px solid #2563eb'}}>
           <div style={{fontSize: '2.5rem', marginBottom: 5}}>🤖</div>
           <h3 style={{margin:0, color:'#1e3a8a', fontSize:'1.1rem'}}>{t('travel')}</h3>
           <p style={{margin:0, fontSize:'0.8rem', color:'#60a5fa'}}>{t('travelDesc')}</p>
        </div>

        {/* 🗺️ MAPS */}
        <div onClick={() => navigate("/map")} className="home-card" style={{background: '#dcfce7', border: '2px solid #16a34a'}}>
           <div style={{fontSize: '2.5rem', marginBottom: 5}}>🗺️</div>
           <h3 style={{margin:0, color:'#14532d', fontSize:'1.1rem'}}>{t('maps')}</h3>
           <p style={{margin:0, fontSize:'0.8rem', color:'#4ade80'}}>{t('mapsDesc')}</p>
        </div>

        {/* 📢 TALKBACK */}
        <div onClick={() => navigate("/talkback")} className="home-card" style={{background: '#f1f5f9', border: '2px solid #cbd5e1'}}>
           <div style={{fontSize: '2rem'}}>📢</div>
           <h4 style={{margin:'5px 0 0 0', color:'#475569'}}>TalkBack</h4>
        </div>

        {/* 🎤 STT */}
        <div onClick={() => navigate("/stt")} className="home-card" style={{background: '#f3e8ff', border: '2px solid #9333ea'}}>
           <div style={{fontSize: '2rem'}}>🎤</div>
           <h4 style={{margin:'5px 0 0 0', color:'#6b21a8'}}>Speech to Text</h4>
        </div>

        {/* 🗣️ TTS */}
        <div onClick={() => navigate("/tts")} className="home-card" style={{background: '#fce7f3', border: '2px solid #db2777'}}>
           <div style={{fontSize: '2rem'}}>🗣️</div>
           <h4 style={{margin:'5px 0 0 0', color:'#9d174d'}}>Text to Speech</h4>
        </div>

        {/* 🔍 MAGNIFIER */}
        <div onClick={() => navigate("/zoom")} className="home-card" style={{background: '#ffedd5', border: '2px solid #ea580c'}}>
           <div style={{fontSize: '2rem'}}>🔍</div>
           <h4 style={{margin:'5px 0 0 0', color:'#c2410c'}}>Magnifier</h4>
        </div>

      </div>

      {/* REPLAY WELCOME */}
      <button onClick={speakWelcome} style={{marginTop: 30, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', width:'100%', textAlign:'center'}}>
        {t('replay')}
      </button>

    </div>
  );
}
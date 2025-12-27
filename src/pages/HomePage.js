import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css"; 
import logo from "../logo.png"; 

export default function HomePage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("viz_user_name") || "Traveler";

  // 🚪 LOGOUT FUNCTION
  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      // 1. Clear Data
      localStorage.removeItem("viz_user_name");
      localStorage.removeItem("viz_guardian_phone");
      
      // 2. Go to Login Page
      navigate("/");
    }
  };

  return (
    <div className="app-container">
      
      {/* HEADER SECTION */}
      <div className="page-header" style={{paddingBottom: 25, position: 'relative'}}>
        
        {/* 🚪 LOGOUT BUTTON (Top Right) */}
        <button 
          onClick={handleLogout}
          style={{
            position: 'absolute', top: 15, right: 15,
            background: '#fee2e2', color: '#ef4444', border: 'none',
            padding: '5px 10px', borderRadius: 8, fontSize: '0.8rem',
            fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          Logout ➜
        </button>

        {/* LOGO & NAME */}
        <img 
          src={logo} 
          alt="Vizhithiru Logo" 
          style={{ width: 80, height: "auto", display: "block", margin: "0 auto 10px auto" }} 
        />
        
        <p style={{margin: 0, color: '#64748b', fontSize: '0.9rem'}}>Welcome,</p>
        <h1 style={{fontSize: "1.8rem", color: "#1e293b", textTransform: 'uppercase', margin: 0}}>{userName}</h1>

        <div style={{ marginTop: 8, padding: "5px 15px", background: "#f1f5f9", borderRadius: "20px", color: "#475569", fontSize: "0.85rem" }}>
          ✨ Empowering Every Journey ✨
        </div>
      </div>

      {/* MENU GRID */}
      <div className="btn-grid">
        
        {/* 🚨 SOS BUTTON */}
        <button 
          onClick={() => navigate("/sos")} 
          className="app-btn full-width"
          style={{ background: '#ef4444', color: 'white', border: '2px solid #b91c1c' }}
        >
          <span style={{fontSize: "2rem"}}>🚨</span>
          EMERGENCY SOS
        </button>

        {/* 1. TRAVEL */}
        <button onClick={() => navigate("/travel")} className="app-btn btn-blue full-width">
          <span style={{fontSize: "1.5rem"}}>🤖</span>
          Travel Assistant
        </button>

        {/* 2. MAPS */}
        <button onClick={() => navigate("/map")} className="app-btn btn-green full-width">
          <span style={{fontSize: "1.5rem"}}>🗺️</span>
          Maps & Navigation
        </button>

        {/* 3. TALKBACK */}
        <button onClick={() => navigate("/talkback")} className="app-btn btn-slate">
          <span style={{fontSize: "1.2rem"}}>📢</span> TalkBack
        </button>

        {/* 4. STT */}
        <button onClick={() => navigate("/stt")} className="app-btn btn-purple">
          <span style={{fontSize: "1.2rem"}}>🎤</span> Speech to Text
        </button>

        {/* 5. TTS */}
        <button onClick={() => navigate("/tts")} className="app-btn btn-pink">
          <span style={{fontSize: "1.2rem"}}>🗣️</span> Text to Speech
        </button>

        {/* 6. MAGNIFIER */}
        <button onClick={() => navigate("/zoom")} className="app-btn btn-orange">
          <span style={{fontSize: "1.2rem"}}>🔍</span> Magnifier
        </button>

      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css"; 
import logo from "../logo.png"; // Ensure you have your logo

export default function LoginPage() {
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isTalkBack, setIsTalkBack] = useState(false);

  // Check if TalkBack was already enabled
  useEffect(() => {
    const tbStatus = localStorage.getItem("vizhithiru_talkback") === "true";
    setIsTalkBack(tbStatus);
  }, []);

  const handleLogin = () => {
    if (!name || !phone) return alert("Please enter Name and Guardian Number");
    
    // SAVE DATA TO MEMORY
    localStorage.setItem("viz_user_name", name);
    localStorage.setItem("viz_guardian_phone", phone);
    
    // Go to Home Page
    navigate("/home");
  };

  const toggleTalkBack = () => {
    const newState = !isTalkBack;
    setIsTalkBack(newState);
    localStorage.setItem("vizhithiru_talkback", newState);
    
    // Speak immediately to confirm
    const msg = newState ? "TalkBack Enabled." : "TalkBack Disabled.";
    const u = new SpeechSynthesisUtterance(msg);
    window.speechSynthesis.speak(u);

    // Reload to activate the "Brain"
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="app-container" style={{justifyContent: 'center', padding: 30}}>
      
      {/* LOGO AREA */}
      <div style={{textAlign: 'center', marginBottom: 30}}>
        <img src={logo} alt="Logo" style={{width: 100, marginBottom: 15}} />
        <h1 style={{fontSize: '1.8rem', color: '#1e293b', margin: 0}}>VIZHITHIRU</h1>
        <p style={{color: '#64748b'}}>Sign in to continue</p>
      </div>

      {/* INPUTS */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
        
        <input 
          type="text" 
          placeholder="Your Name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        
        <input 
          type="tel" 
          placeholder="Guardian Phone Number" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />

        {/* MAIN LOGIN BUTTON */}
        <button onClick={handleLogin} className="app-btn btn-blue" style={{marginTop: 10}}>
          Login
        </button>

        {/* FAKE GOOGLE BUTTON */}
        <button className="app-btn" style={{background: 'white', border: '1px solid #cbd5e1', color: '#475569', display: 'flex', flexDirection: 'row', gap: 10}}>
           <img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="20" alt="G" />
           Sign in with Google
        </button>

      </div>

      {/* TALKBACK TOGGLE (ACCESSIBILITY) */}
      <div style={{marginTop: 40, textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 20}}>
        <p style={{marginBottom: 10, fontSize: '0.9rem', fontWeight: 'bold'}}>Accessibility Options</p>
        <button 
          onClick={toggleTalkBack}
          style={{
            background: isTalkBack ? '#22c55e' : '#e2e8f0',
            color: isTalkBack ? 'white' : '#64748b',
            border: 'none', padding: '10px 20px', borderRadius: 50,
            cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 10, margin: '0 auto'
          }}
        >
          {isTalkBack ? "🔊 TalkBack ON" : "🔇 Enable TalkBack"}
        </button>
      </div>

    </div>
  );
}

const inputStyle = {
  padding: 15, borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none'
};
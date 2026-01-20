import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css"; 
import logo from "../logo.png"; // Ensure you have this image
import { auth, provider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isTalkBack, setIsTalkBack] = useState(false);

  useEffect(() => {
    // Check session storage for accessibility setting
    const tbStatus = sessionStorage.getItem("vizhithiru_talkback") === "true";
    setIsTalkBack(tbStatus);
    
    // Auto-clear old session data on load to prevent mixing
    sessionStorage.removeItem("viz_user_name");
    sessionStorage.removeItem("viz_guardian_phone");
  }, []);

  const handleLogin = async () => {
    if (!name || !phone) return alert("Please enter Name and Guardian Number");
    await saveToBackend(name, phone);
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await saveToBackend(user.displayName, user.email || "Google-User");
    } catch (error) {
      console.error("❌ Google Login Error:", error);
      alert("Google Sign-In Failed.");
    }
  };

  const saveToBackend = async (userName, userContact) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName, phone: userContact })
      });

      const data = await response.json();

      if (data.success) {
        // ✅ CHANGED TO SESSION STORAGE
        sessionStorage.setItem("viz_user_name", userName);
        sessionStorage.setItem("viz_guardian_phone", userContact);
        
        navigate("/home");
      } else {
        alert("Server Error: " + data.message);
      }
    } catch (error) {
      console.error("Connection Error:", error);
      // Fallback for Google users if backend is down
      if(userContact.includes("@") || userContact === "Google-User") {
          sessionStorage.setItem("viz_user_name", userName);
          navigate("/home");
      } else {
          alert("⚠️ CONNECTION ERROR!\nMake sure backend is running on Port 5000");
      }
    }
  };

  const toggleTalkBack = () => {
    const newState = !isTalkBack;
    setIsTalkBack(newState);
    sessionStorage.setItem("vizhithiru_talkback", newState);
    
    const msg = newState ? "TalkBack Enabled." : "TalkBack Disabled.";
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg));
    
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="app-container" style={{justifyContent: 'center', padding: 30}}>
      <div style={{textAlign: 'center', marginBottom: 30}}>
        <img src={logo} alt="Logo" style={{width: 100, marginBottom: 15}} />
        <h1 style={{fontSize: '1.8rem', color: '#1e293b', margin: 0}}>VIZHITHIRU</h1>
        <p style={{color: '#64748b'}}>Sign in to continue</p>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
        <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <input type="tel" placeholder="Guardian Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />

        <button onClick={handleLogin} className="app-btn btn-blue" style={{marginTop: 10}}>Login</button>
        <button onClick={handleGoogleLogin} className="app-btn" style={{background: 'white', border: '1px solid #cbd5e1', color: '#475569', display: 'flex', gap: 10, justifyContent: 'center'}}>
           Sign in with Google
        </button>
      </div>

      <div style={{marginTop: 40, textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 20}}>
        <button onClick={toggleTalkBack} style={{background: isTalkBack ? '#22c55e' : '#e2e8f0', color: isTalkBack ? 'white' : '#64748b', border: 'none', padding: '10px 20px', borderRadius: 50, cursor: 'pointer', fontWeight: 'bold'}}>
          {isTalkBack ? "🔊 TalkBack ON" : "🔇 Enable TalkBack"}
        </button>
        <p style={{fontSize: '0.9rem', color: '#64748b', marginTop: 20}}>
          Are you a Driver? <span onClick={() => navigate("/driver-login")} style={{color: '#2563eb', fontWeight: 'bold', cursor: 'pointer'}}>Login Here</span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = { padding: 15, borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' };
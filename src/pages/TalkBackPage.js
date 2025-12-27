import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function TalkBackPage() {
  const navigate = useNavigate();
  
  // Load state from memory
  const [isEnabled, setIsEnabled] = useState(
    localStorage.getItem("vizhithiru_talkback") === "true"
  );

  const toggleTalkBack = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    // Save to memory so the Manager knows what to do
    localStorage.setItem("vizhithiru_talkback", newState);
    
    const msg = newState ? "TalkBack Enabled." : "TalkBack Disabled.";
    const u = new SpeechSynthesisUtterance(msg);
    window.speechSynthesis.speak(u);

    // Reload the page to activate/deactivate the Manager
    setTimeout(() => {
        window.location.reload(); 
    }, 1000);
  };

  return (
    <div className="travel-container" style={{ textAlign: "center", paddingTop: 50 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ color: "#1e293b", marginBottom: 10 }}>📢 TalkBack Mode</h1>
        <p style={{ color: "#64748b" }}>Screen Reader Simulator</p>
      </div>

      {/* THE BIG SWITCH */}
      <div 
        onClick={toggleTalkBack}
        style={{
          width: 200,
          height: 200,
          margin: "0 auto",
          borderRadius: "50%",
          background: isEnabled ? "#22c55e" : "#cbd5e1", // Green = ON, Grey = OFF
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease"
        }}
      >
        <span style={{ fontSize: "4rem" }}>{isEnabled ? "🔊" : "🔇"}</span>
        <h2 style={{ color: "white", marginTop: 10 }}>{isEnabled ? "ON" : "OFF"}</h2>
      </div>

      <p style={{ marginTop: 30, maxWidth: 300, marginInline: "auto", color: "#64748b" }}>
        {isEnabled 
          ? "TalkBack is Active. Hover over any element on ANY page to hear it read aloud."
          : "Tap the circle to enable accessible screen reading."}
      </p>

      <button 
        onClick={() => navigate("/")} 
        style={{ marginTop: 40, background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", textDecoration: "underline" }}
      >
        ⬅ Back to Home
      </button>
    </div>
  );
}

export default TalkBackPage;
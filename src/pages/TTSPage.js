import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function TTSPage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");

  const speak = () => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>Text to Speech</h1>
        <p>Type and I will speak</p>
      </div>

      <textarea 
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something here..."
        style={{
          width: '100%', height: 150, padding: 15,
          borderRadius: 12, border: '2px solid #e2e8f0', fontSize: '1.2rem',
          resize: 'none', marginBottom: 20
        }}
      />

      <div className="btn-grid">
        <button onClick={speak} className="app-btn btn-pink full-width">
          <span style={{fontSize:'1.5rem'}}>🗣️</span> Speak Now
        </button>
        
        <button onClick={() => setText("")} className="app-btn btn-slate">
          Clear
        </button>
      </div>

      <div style={{marginTop: 'auto', textAlign:'center', paddingTop: 30}}>
        <button onClick={() => navigate("/home")} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}>
          ⬅ Back to Home
        </button>
      </div>
    </div>
  );
}
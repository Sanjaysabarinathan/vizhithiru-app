import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function STTPage() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState("");
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true; // Keep listening
      rec.lang = "en-IN";
      rec.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map(result => result[0].transcript)
          .join('');
        setText(transcript);
      };
      setRecognition(rec);
    }
  }, []);

  const toggleListen = () => {
    if (!recognition) return alert("Browser not supported");
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>Speech to Text</h1>
        <p>I will write what you say</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* BIG MIC BUTTON */}
        <div 
          onClick={toggleListen}
          style={{
            width: 120, height: 120, borderRadius: '50%',
            background: isListening ? '#ef4444' : '#7c3aed',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease', animation: isListening ? 'pulse 1.5s infinite' : 'none'
          }}
        >
          {isListening ? "⏹" : "🎤"}
        </div>
        
        <p style={{marginTop: 15, fontWeight: 'bold', color: isListening ? '#ef4444' : '#64748b'}}>
          {isListening ? "Listening..." : "Tap mic to start"}
        </p>

        {/* TRANSCRIPT BOX */}
        <textarea 
          value={text}
          readOnly
          placeholder="Your words will appear here..."
          style={{
            width: '100%', height: 200, marginTop: 30, padding: 15,
            borderRadius: 12, border: '2px solid #e2e8f0', fontSize: '1.1rem',
            resize: 'none', background: '#f8fafc'
          }}
        />

        {/* CLEAR BUTTON */}
        {text && (
          <button 
            onClick={() => setText("")}
            className="app-btn btn-slate"
            style={{marginTop: 15, width: 'auto', padding: '10px 20px'}}
          >
            Clear Text
          </button>
        )}
      </div>

      <button onClick={() => navigate("/")} style={{marginTop: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}>
        ⬅ Back to Home
      </button>
    </div>
  );
}
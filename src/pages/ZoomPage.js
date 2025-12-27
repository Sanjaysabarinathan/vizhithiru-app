import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function ZoomPage() {
  const navigate = useNavigate();
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>Magnifier</h1>
        <p>Adjust text size for readability</p>
      </div>

      {/* PREVIEW BOX */}
      <div 
        style={{
          background: 'white', border: '2px solid #e2e8f0', borderRadius: 12,
          padding: 20, height: 250, overflow: 'auto', marginBottom: 30,
          transition: 'font-size 0.2s ease' // Smooth transition
        }}
      >
        <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', width: `${100 / zoomLevel}%` }}>
          <h2 style={{margin:0}}>Sample Text</h2>
          <p>
            This is a test of the magnifier tool. Use the buttons below to make this text larger or smaller. 
            This helps people with low vision read clearly.
          </p>
          <p>
            <strong>Bus No:</strong> 42<br/>
            <strong>Route:</strong> Town Hall to Railway Station
          </p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="btn-grid">
        <button 
          onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))} 
          className="app-btn btn-slate"
        >
          ➖ Zoom Out
        </button>

        <button 
          onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.2))} 
          className="app-btn btn-orange"
        >
          ➕ Zoom In
        </button>
      </div>
      
      <p style={{textAlign:'center', marginTop: 10, fontWeight:'bold'}}>
        Current Zoom: {Math.round(zoomLevel * 100)}%
      </p>

      <div style={{marginTop: 'auto', textAlign:'center', paddingTop: 20}}>
        <button onClick={() => navigate("/")} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}>
          ⬅ Back to Home
        </button>
      </div>
    </div>
  );
}
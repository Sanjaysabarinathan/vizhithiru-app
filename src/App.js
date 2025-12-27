import React from 'react';
import './App.css'; 
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TalkBackManager from './TalkBackManager';

// Import All Pages
import LoginPage from './pages/LoginPage'; // ⬅ NEW IMPORT
import HomePage from './pages/HomePage';
import TravelPage from './pages/TravelPage';
import MapsPage from './pages/MapsPage';
import TalkBackPage from './pages/TalkBackPage';
import STTPage from './pages/STTPage';
import TTSPage from './pages/TTSPage';
import ZoomPage from './pages/ZoomPage';
import SOSPage from './pages/SOSPage'; 

function App() {
  return (
    <BrowserRouter>
      <TalkBackManager />

      <Routes>
        {/* 1. LOGIN IS NOW THE DEFAULT PAGE (path="/") */}
        <Route path="/" element={<LoginPage />} />

        {/* 2. HOME IS NOW "/home" */}
        <Route path="/home" element={<HomePage />} />

        {/* Other Pages */}
        <Route path="/travel" element={<TravelPage />} />
        <Route path="/map" element={<MapsPage />} />
        <Route path="/talkback" element={<TalkBackPage />} />
        <Route path="/stt" element={<STTPage />} />
        <Route path="/tts" element={<TTSPage />} />
        <Route path="/zoom" element={<ZoomPage />} />
        <Route path="/sos" element={<SOSPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
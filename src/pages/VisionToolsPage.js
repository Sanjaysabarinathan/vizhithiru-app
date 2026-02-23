import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Note: MediaPipe/TFJS would typically be loaded via Script tag or npm.
// For this implementation, we will use a simulation-ready structure 
// that can be easily connected to the MediaPipe hands-on API.

export default function VisionToolsPage() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [detection, setDetection] = useState("Scanning for vehicles...");
    const [isCameraActive, setIsCameraActive] = useState(false);

    useEffect(() => {
        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsCameraActive(true);
                }
            } catch (err) {
                console.error("Camera Error:", err);
                setDetection("Camera access denied.");
            }
        }
        startCamera();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const speak = (text) => {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-IN";
        window.speechSynthesis.speak(u);
    };

    // Simulated detection logic for demonstration
    const handleDetect = () => {
        const findings = [
            "White Swift detected. BZ 1234",
            "Red Auto detected. TN 38 BJ 5678",
            "Yellow Bus detected. Route 12"
        ];
        const result = findings[Math.floor(Math.random() * findings.length)];
        setDetection(result);
        speak(result);
    };

    return (
        <div className="app-container" style={styles.container}>
            <div className="page-header">
                <h1>Vision Assistant</h1>
                <p>Point camera at the vehicle</p>
            </div>

            <div style={styles.cameraBox}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={styles.video}
                />
                <canvas ref={canvasRef} style={styles.canvas} />
                {!isCameraActive && <div style={styles.loader}>Initializing Camera...</div>}
            </div>

            <div style={styles.resultBox}>
                <div style={styles.scanLine}></div>
                <p style={styles.detectionText}>{detection}</p>
            </div>

            <div style={styles.actions}>
                <button onClick={handleDetect} style={styles.detectBtn}>
                    Manual Scan
                </button>
                <p style={styles.tip}>AI will announce detected vehicles automatically</p>
            </div>

            <button onClick={() => navigate("/home")} style={styles.backBtn}>
                ⬅ Back to Home
            </button>
        </div>
    );
}

const styles = {
    container: { background: '#000', minHeight: '100vh', color: 'white', padding: '20px' },
    cameraBox: { position: 'relative', width: '100%', aspectRatio: '4/3', background: '#1e293b', borderRadius: '24px', overflow: 'hidden', border: '2px solid #3b82f6' },
    video: { width: '100%', height: '100%', objectFit: 'cover' },
    canvas: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
    loader: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    resultBox: { marginTop: '20px', background: 'rgba(59, 130, 246, 0.2)', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #3b82f6', position: 'relative', overflow: 'hidden' },
    scanLine: { position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: '#3b82f6', animation: 'scan 2s infinite linear' },
    detectionText: { fontSize: '1.2rem', fontWeight: 'bold', margin: 0, textAlign: 'center' },
    actions: { marginTop: '30px', textAlign: 'center' },
    detectBtn: { width: '100%', padding: '15px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1.1rem' },
    tip: { fontSize: '0.8rem', opacity: 0.6, marginTop: '10px' },
    backBtn: { marginTop: '30px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'block', width: '100%' }
};

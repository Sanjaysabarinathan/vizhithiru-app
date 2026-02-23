import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function DriverLoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("Auto");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  useEffect(() => {
    // ✅ Clear SESSION storage on load
    sessionStorage.clear();
  }, []);

  const validateVehicleNumber = (num) => {
    const pattern = /^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/;
    return pattern.test(num);
  };

  const handleDriverLogin = async () => {
    if (!name || !phone || !vehicleNumber) return alert("Please fill all details!");
    if (!validateVehicleNumber(vehicleNumber)) return alert("❌ Invalid Vehicle Number!\nFormat: TN-99-AA-1234");

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if ((await res.json()).success) {
        setIsOtpSent(true);
        alert("OTP sent to your number!");
      }
    } catch (e) { alert("Backend Error"); }
  };

  const verifyOtp = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      if ((await res.json()).success) {
        await saveToBackend();
      } else {
        alert("Invalid OTP!");
      }
    } catch (e) { alert("Verification Failed"); }
  };

  const saveToBackend = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, vehicleType, vehicleNumber })
      });
      const data = await response.json();

      if (data.success) {
        alert("✅ Driver Login Successful!");
        sessionStorage.setItem("viz_driver_id", data.driver._id);
        sessionStorage.setItem("viz_driver_name", data.driver.name);
        sessionStorage.setItem("viz_driver_type", vehicleType);
        navigate("/driver-dashboard");
      } else { alert("Login Failed: " + data.error); }
    } catch (error) { alert("⚠️ Connection Error!"); }
  };

  return (
    <div className="app-container" style={{ padding: 30, justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}><h1 style={{ fontSize: '1.8rem', color: '#1e293b' }}>🚖 Driver Partner</h1><p style={{ color: '#64748b' }}>Join to help visually impaired travelers</p></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {!isOtpSent ? (
          <>
            <input type="text" placeholder="Driver Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            <label style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: -10 }}>Select Vehicle Type:</label>
            <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={inputStyle}><option value="Auto">🛺 Auto Rickshaw</option><option value="Bike">🛵 Bike</option><option value="Bus">🚌 Bus</option><option value="Train">🚆 Train</option></select>
            <input type="text" placeholder="Vehicle No (e.g. TN-33-AA-1234)" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} style={inputStyle} />
            <button onClick={handleDriverLogin} className="app-btn btn-blue" style={{ marginTop: 10, background: '#f59e0b' }}>Get OTP</button>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', color: '#64748b' }}>OTP sent to {phone}</div>
            <input type="tel" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ ...inputStyle, textAlign: 'center', letterSpacing: 5 }} />
            <button onClick={verifyOtp} className="app-btn btn-blue" style={{ marginTop: 10, background: '#f59e0b' }}>Verify & Start Duty</button>
            <button onClick={() => setIsOtpSent(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Back</button>
          </>
        )}
      </div>
    </div>
  );
}
const inputStyle = { padding: 15, borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', background: 'white' };
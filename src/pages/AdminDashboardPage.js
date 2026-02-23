import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalRides: 0, activeDrivers: 0, revenue: 0 });
    const [drivers, setDrivers] = useState([]);

    useEffect(() => {
        // Simulate fetching admin data
        setStats({ totalRides: 142, activeDrivers: 8, revenue: 12540 });
        setDrivers([
            { id: "D001", name: "Raja", vehicle: "Auto", status: "Active" },
            { id: "D002", name: "JK", vehicle: "Bike", status: "Active" },
            { id: "D003", name: "Suresh", vehicle: "Auto", status: "Pending" }
        ]);
    }, []);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>Admin Command Center</h1>
                <button onClick={() => navigate("/home")} style={styles.backBtn}>Exit</button>
            </header>

            <div style={styles.statsGrid}>
                <div style={styles.statCard}><h3>{stats.totalRides}</h3><p>Total Rides</p></div>
                <div style={styles.statCard}><h3>{stats.activeDrivers}</h3><p>Drivers</p></div>
                <div style={styles.statStatCard}><h3>₹{stats.revenue}</h3><p>Revenue</p></div>
            </div>

            <section style={styles.section}>
                <h2>Driver Verification</h2>
                <div style={styles.list}>
                    {drivers.map(d => (
                        <div key={d.id} style={styles.listItem}>
                            <div>
                                <strong>{d.name}</strong> ({d.vehicle})
                                <br /><span style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {d.id}</span>
                            </div>
                            <span style={{ ...styles.badge, background: d.status === 'Active' ? '#dcfce7' : '#fef9c3', color: d.status === 'Active' ? '#166534' : '#854d0e' }}>
                                {d.status}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            <section style={styles.section}>
                <h2>Ride Heatmap (Coimbatore/Tiruppur)</h2>
                <div style={styles.mapPlaceholder}>
                    <p>📍 Coimbatore: High Density (Gandhipuram, RS Puram)</p>
                    <p>📍 Tiruppur: Medium Density (Railway Station)</p>
                    <div style={styles.heatmapSim}>
                        <div style={{ ...styles.dot, top: '30%', left: '40%', size: '40px', opacity: 0.6 }}></div>
                        <div style={{ ...styles.dot, top: '50%', left: '60%', size: '20px', opacity: 0.4 }}></div>
                    </div>
                </div>
            </section>
        </div>
    );
}

const styles = {
    container: { padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    backBtn: { background: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' },
    statCard: { background: 'white', padding: '20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    statStatCard: { background: '#3b82f6', color: 'white', padding: '20px', borderRadius: '16px', textAlign: 'center' },
    section: { marginBottom: '30px' },
    list: { display: 'flex', flexDirection: 'column', gap: '10px' },
    listItem: { background: 'white', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' },
    mapPlaceholder: { background: '#1e293b', color: '#cbd5e1', padding: '30px', borderRadius: '20px', textAlign: 'center', minHeight: '200px', position: 'relative' },
    heatmapSim: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' },
    dot: { position: 'absolute', background: '#ef4444', borderRadius: '50%', filter: 'blur(10px)' }
};

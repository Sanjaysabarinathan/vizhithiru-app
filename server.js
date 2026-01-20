const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000; // ✅ Running on Port 5000

// --- MIDDLEWARE ---
app.use(cors()); // Allows Frontend (Port 3000) to talk to Backend
app.use(express.json());

// --- DATABASE CONNECTION ---
// Replace with your actual connection string
const MONGO_URI = "mongodb+srv://sanjay:sanjay123@cluster0.9sxfjed.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch((err) => console.log("❌ DB Connection Error:", err.message));

// ==========================
//        SCHEMAS
// ==========================

// 1. USER
const UserSchema = new mongoose.Schema({
    name: String,
    phone: String,
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", UserSchema);

// 2. DRIVER
const DriverSchema = new mongoose.Schema({
    name: String,
    phone: String,
    vehicleType: String,
    vehicleNumber: String,
    status: { type: String, default: "Available" },
    createdAt: { type: Date, default: Date.now }
});
const Driver = mongoose.model("Driver", DriverSchema);

// 3. RIDE REQUEST (With OTP & Driver Info)
const RideSchema = new mongoose.Schema({
    riderName: String,
    riderPhone: String,
    vehicleType: String,
    pickupLocation: String,
    status: { type: String, default: "Pending" }, // Pending, Accepted, In Progress, Completed
    
    // Driver Details (Filled when accepted)
    driverId: String,
    driverName: String,      
    vehicleNumber: String,
    
    // Security
    otp: String,            // 4-Digit Code
    createdAt: { type: Date, default: Date.now }
});
const Ride = mongoose.model("Ride", RideSchema);

// 4. INCIDENT (SOS)
const IncidentSchema = new mongoose.Schema({
    userName: String,
    guardianPhone: String,
    location: String,
    status: { type: String, default: "Active" },
    timestamp: { type: Date, default: Date.now }
});
const Incident = mongoose.model("Incident", IncidentSchema);

// ==========================
//         ROUTES
// ==========================

app.get('/', (req, res) => res.send("🚀 Vizhithiru Server Running"));

// --- AUTHENTICATION ---

// User Login
app.post('/api/login', async (req, res) => {
    const { name, phone } = req.body;
    try {
        let user = await User.findOne({ phone });
        if (!user) {
            user = new User({ name, phone });
            await user.save();
        }
        console.log(`📥 Login: ${name} (${phone})`);
        res.json({ success: true, user });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// Driver Login
app.post('/api/driver/login', async (req, res) => {
    const { name, phone, vehicleType, vehicleNumber } = req.body;
    try {
        let driver = await Driver.findOne({ phone });
        if (!driver) {
            driver = new Driver({ name, phone, vehicleType, vehicleNumber });
            await driver.save();
        }
        console.log(`🚖 Driver Login: ${name}`);
        res.json({ success: true, driver });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// --- RIDE MANAGEMENT ---

// 1. Request a Ride (User)
app.post('/api/ride/request', async (req, res) => {
    const { riderName, riderPhone, vehicleType, pickupLocation, otp } = req.body;
    console.log(`🚖 Request: ${vehicleType} for ${riderName} (OTP: ${otp})`);
    try {
        const newRide = new Ride({ riderName, riderPhone, vehicleType, pickupLocation, otp });
        await newRide.save();
        res.json({ success: true, rideId: newRide._id });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// 2. Get Pending Rides (Driver) - AUTOMATIC CLEANUP (Last 1 Hour Only)
app.get('/api/ride/pending', async (req, res) => {
    try {
        // Only show rides created in the last 60 minutes
        const timeLimit = new Date(Date.now() - 60 * 60 * 1000);

        const rides = await Ride.find({ 
            status: "Pending", 
            createdAt: { $gte: timeLimit } 
        }).sort({ createdAt: -1 });

        res.json({ success: true, rides });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// 3. Accept Ride (Driver)
app.post('/api/ride/accept', async (req, res) => {
    const { rideId, driverId, driverName, vehicleNumber } = req.body;
    console.log(`✅ Ride accepted by ${driverName}`);
    try {
        await Ride.findByIdAndUpdate(rideId, { 
            status: "Accepted", 
            driverId, 
            driverName, 
            vehicleNumber 
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Update Error" }); }
});

// 4. Verify OTP & Start Ride (Driver)
app.post('/api/ride/verify', async (req, res) => {
    const { rideId, enteredOtp } = req.body;
    try {
        const ride = await Ride.findById(rideId);
        if (ride && ride.otp === enteredOtp) {
            ride.status = "In Progress";
            await ride.save();
            res.json({ success: true, message: "OTP Verified! Ride Started." });
        } else {
            res.json({ success: false, message: "Wrong OTP!" });
        }
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// 5. Check Ride Status (User Polling)
app.get('/api/ride/status/:id', async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);
        if(ride) res.json({ success: true, ride });
        else res.json({ success: false });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

// 6. Get User History (By Phone)
app.get('/api/ride/history/:phone', async (req, res) => {
    const { phone } = req.params;
    try {
        const history = await Ride.find({ riderPhone: phone }).sort({ createdAt: -1 });
        res.json({ success: true, history });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// --- EMERGENCY ---

app.post('/api/sos', async (req, res) => {
    const { userName, guardianPhone, location } = req.body;
    try {
        const newIncident = new Incident({ userName, guardianPhone, location });
        await newIncident.save();
        console.log(`🚨 SOS ALERT from ${userName}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "SOS Error" }); }
});

// --- DEBUGGING & CLEANUP ---

// View All Users
app.get('/api/users/all', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// 🏁 DRIVER: COMPLETE RIDE
app.post('/api/ride/complete', async (req, res) => {
    const { rideId } = req.body;
    try {
        await Ride.findByIdAndUpdate(rideId, { status: "Completed" });
        res.json({ success: true, message: "Ride Completed!" });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// Clear All Rides (Use this to clean your database)
app.get('/api/nuke/rides', async (req, res) => {
    await Ride.deleteMany({});
    res.send("💥 All ride history has been deleted. Fresh start!");
});

// 🗑️ USER: CLEAR MY HISTORY
app.delete('/api/ride/clear/:phone', async (req, res) => {
    const { phone } = req.params;
    try {
        // Delete all rides associated with this phone number
        await Ride.deleteMany({ riderPhone: phone });
        res.json({ success: true, message: "History Cleared" });
    } catch (e) { 
        res.status(500).json({ error: "DB Error" }); 
    }
});

// --- START SERVER ---
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
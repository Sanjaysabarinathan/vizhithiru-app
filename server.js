const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = 5000;

app.use(cors());
app.use(express.json());

const MONGO_URI = "mongodb+srv://sanjay:sanjay123@cluster0.9sxfjed.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch((err) => console.log("❌ DB Error:", err.message));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({ name: String, phone: String, createdAt: { type: Date, default: Date.now } });
UserSchema.index({ phone: 1 });
const User = mongoose.model("User", UserSchema);

const DriverSchema = new mongoose.Schema({ name: String, phone: String, vehicleType: String, vehicleNumber: String, status: { type: String, default: "Available" }, wallet: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } });
DriverSchema.index({ phone: 1 });
const Driver = mongoose.model("Driver", DriverSchema);

const RideSchema = new mongoose.Schema({
    riderName: String, riderPhone: String, vehicleType: String, pickupLocation: String, otp: String,
    driverId: String, driverName: String, vehicleNumber: String,
    fare: { type: Number, default: 0 }, distance: { type: Number, default: 2 },
    status: { type: String, default: "Pending" }
}, { timestamps: true }); // ✅ Fixes "Invalid Date"
RideSchema.index({ status: 1 });
RideSchema.index({ driverId: 1, status: 1 });
RideSchema.index({ riderPhone: 1 });

const Ride = mongoose.model("Ride", RideSchema);

// --- UTILS ---
const calculateFare = (vehicleType) => {
    // Generate a consistent distance for this specific calculation session
    const distKm = parseFloat((Math.random() * 8 + 2).toFixed(1));
    const baseRates = { 'Auto': 30, 'Bike': 15, 'Bus': 10, 'Train': 10 };
    const perKmRates = { 'Auto': 15, 'Bike': 8, 'Bus': 5, 'Train': 5 };

    const base = baseRates[vehicleType] || 30;
    const rate = perKmRates[vehicleType] || 15;
    const fare = Math.round(base + (distKm * rate));

    return { fare, distance: distKm };
};

// Simulated OTP Store
const otpStore = {}; // { phone: otp }

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);
    socket.on('join_driver_pool', (vehicleType) => {
        socket.join(`pool_${vehicleType}`);
        console.log(`Driver joined ${vehicleType} pool`);
    });
});

// --- ROUTES ---

app.post('/api/auth/send-otp', (req, res) => {
    const { phone } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[phone] = otp;

    console.log(`🔐 [AUTH] OTP for ${phone}: ${otp}`);
    res.json({ success: true, message: "OTP sent successfully" });
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    if (otpStore[phone] === otp) {
        delete otpStore[phone]; // Clear after use
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: "Invalid OTP" });
    }
});

app.post('/api/login', async (req, res) => {
    const { name, phone } = req.body;
    try {
        let user = await User.findOneAndUpdate({ phone }, { name }, { upsert: true, new: true });
        res.json({ success: true, user });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

app.post('/api/driver/login', async (req, res) => {
    const { name, phone, vehicleType, vehicleNumber } = req.body;
    try {
        let driver = await Driver.findOneAndUpdate({ phone }, { name, vehicleType, vehicleNumber }, { upsert: true, new: true });
        res.json({ success: true, driver });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

app.post('/api/ride/request', async (req, res) => {
    try {
        const { fare, distance } = calculateFare(req.body.vehicleType);
        const newRide = new Ride({ ...req.body, fare, distance });
        await newRide.save();

        // Notify drivers in the pool
        io.to(`pool_${req.body.vehicleType}`).emit('new_ride_request', newRide);

        res.json({ success: true, rideId: newRide._id, fare, distance });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

app.get('/api/ride/pending', async (req, res) => {
    try {
        // Only show rides that haven't been accepted yet
        const rides = await Ride.find({ status: "Pending" }).sort({ createdAt: -1 });
        res.json({ success: true, rides });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

app.post('/api/ride/accept', async (req, res) => {
    try {
        const { rideId, driverId, driverName, vehicleNumber } = req.body;
        const ride = await Ride.findByIdAndUpdate(rideId, { status: "Accepted", driverId, driverName, vehicleNumber }, { new: true });

        // Notify rider
        io.emit(`ride_update_${rideId}`, { status: "Accepted", driverName, vehicleNumber });
        // Notify other drivers to remove it from their lists
        io.emit('ride_taken', { rideId });

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Update Error" }); }
});

// ✅ DRIVER HISTORY: Strictly by Driver ID
app.get('/api/ride/driver-history/:driverId', async (req, res) => {
    try {
        const history = await Ride.find({ driverId: req.params.driverId, status: "Completed" }).sort({ updatedAt: -1 });
        res.json({ success: true, history });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// ✅ USER HISTORY: Strictly by Rider Phone
app.get('/api/ride/history/:phone', async (req, res) => {
    try {
        const history = await Ride.find({ riderPhone: req.params.phone }).sort({ createdAt: -1 });
        res.json({ success: true, history });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

app.post('/api/ride/complete', async (req, res) => {
    try {
        const { rideId } = req.body;
        const ride = await Ride.findByIdAndUpdate(rideId, { status: "Completed" }, { new: true });

        // Update Driver Wallet
        if (ride.driverId && ride.fare) {
            await Driver.findByIdAndUpdate(ride.driverId, { $inc: { wallet: ride.fare } });
        }

        io.emit(`ride_update_${rideId}`, { status: "Completed" });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// ✅ GET ACTIVE RIDE FOR DRIVER (Session Restoration)
app.get('/api/ride/active-driver/:driverId', async (req, res) => {
    try {
        const ride = await Ride.findOne({
            driverId: req.params.driverId,
            status: { $in: ["Accepted", "Arrived", "In Progress"] }
        });
        res.json({ success: true, ride });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// ✅ UPDATE RIDE STATUS (Generic)
app.post('/api/ride/update-status', async (req, res) => {
    try {
        const { rideId, status } = req.body;
        const ride = await Ride.findByIdAndUpdate(rideId, { status }, { new: true });

        // Notify rider
        io.emit(`ride_update_${rideId}`, { status });

        res.json({ success: true, ride });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// ✅ GET ACTIVE RIDE FOR USER (Session Restoration & OTP Persistence)
app.get('/api/ride/active-user/:phone', async (req, res) => {
    try {
        const ride = await Ride.findOne({
            riderPhone: req.params.phone,
            status: { $in: ["Pending", "Accepted", "Arrived", "In Progress"] }
        }).sort({ createdAt: -1 }); // Get most recent active
        res.json({ success: true, ride });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// --- SOS 2.0 ---
app.post('/api/sos/call', async (req, res) => {
    const { phone, name } = req.body;
    console.log(`🚨 SOS Call requested for ${name} to ${phone}`);
    // Simulate Twilio call setup
    // const client = require('twilio')(accountSid, authToken);
    // client.calls.create({ url: 'http://demo.twilio.com/docs/voice.xml', to: phone, from: '+123456789' });
    res.json({ success: true, message: "Emergency call initiated (Simulated)" });
});

server.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));

// server.js - Node.js Express Backend with MongoDB

require("dotenv").config();

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// MONGODB CONFIGURATION
// REPLACE THE PLACEHOLDER BELOW WITH YOUR ACTUAL MONGODB ATLAS CONNECTION STRING
// OR set the MONGODB_URI environment variable on your hosting provider (e.g. Render/Railway).
// Example: "mongodb+srv://<username>:<password>@cluster0.mongodb.net/myDatabase?retryWrites=true&w=majority"
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI ;

let db, statsCollection, logsCollection;

async function connectDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db('webar_navigation');
        statsCollection = db.collection('scan_stats');
        logsCollection = db.collection('scan_logs'); // Logs raw scans for audit trails and rich statistics
        console.log("MongoDB connected successfully!");
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
    }
}
connectDB();

// API Endpoint to process QR scan and return the total count
app.get('/api/scan', async (req, res) => {
    try {
        const dest = req.query.dest || 'direct';
        const isIncrement = req.query.increment === 'true';

        // Check if DB is connected (fallback to a dummy mock count if database is not configured yet)
        if (!db) {
            return res.json({ 
                count: 123, 
                message: "Running in offline demo mode. Please configure your MONGODB_URI in server.js." 
            });
        }

        if (isIncrement) {
            // 1. Atomically increment the global counter
            await statsCollection.updateOne(
                { _id: 'global_counter' },
                { $inc: { total_scans: 1 } },
                { upsert: true }
            );

            // 2. Log metadata for this scan to support future rich statistics
            await logsCollection.insertOne({
                timestamp: new Date(),
                destination: dest,
                userAgent: req.headers['user-agent'] || 'unknown',
                referrer: req.query.ref || 'unknown'
            });
        }

        // Fetch current total count
        const data = await statsCollection.findOne({ _id: 'global_counter' });
        res.json({ count: data ? data.total_scans : 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

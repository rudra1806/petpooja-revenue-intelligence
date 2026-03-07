require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const orderRoutes = require("./routes/orderRoutes");
const twilioRoutes = require("./routes/twilioRoutes");
const billRoutes = require("./routes/billRoutes");
const generateSpeech = require("./services/sarvamService");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Twilio sends form-encoded data
app.use("/audio", express.static("public/audio")); // Serve Sarvam audio files

const path = require("path");
const fs = require("fs");

// Test Route for Sarvam in Chrome
app.get("/test-sarvam", async (req, res) => {
    const text = req.query.text || "Hello! Sarvam AI is working perfectly.";
    try {
        const audioBase64 = await generateSpeech(text);
        if (!audioBase64) return res.send("❌ Sarvam failed to generate audio.");

        const fileName = `test_${Date.now()}.wav`;
        const filePath = path.join(__dirname, "public/audio", fileName);
        fs.writeFileSync(filePath, Buffer.from(audioBase64, "base64"));

        res.redirect(`/audio/${fileName}`);
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
});


// Routes
app.use("/", orderRoutes);
app.use("/", twilioRoutes);
app.use("/api", billRoutes);

// ========================
// SARVAM TTS ROUTE
// ========================

app.post("/tts", async (req, res) => {

    const { text } = req.body;

    try {
        const audio = await generateSpeech(text);
        res.json({ audio });

    } catch (err) {

        console.error("TTS error:", err.message);

        res.status(500).send("TTS failed");

    }

});


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {

        console.log("✅ MongoDB Connected");

        app.listen(process.env.PORT, () => {
            console.log(`🚀 Server running on port ${process.env.PORT}`);
        });

    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Failed:", err);
    });
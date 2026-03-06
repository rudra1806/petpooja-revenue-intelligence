require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const orderRoutes = require("./routes/orderRoutes");
const generateSpeech = require("./services/ttsService");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/", orderRoutes);

// ========================
// SARVAM TTS ROUTE
// ========================

app.post("/tts", async (req, res) => {

    const { text } = req.body;

    try {

        const audio = await generateSpeech(text);

        res.json({
            audio
        });

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
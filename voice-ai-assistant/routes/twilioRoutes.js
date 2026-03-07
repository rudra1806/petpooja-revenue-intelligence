const express = require("express");
const router = express.Router();
const {
    handleIncomingCall,
    handleGather,
    handleCallStatus
} = require("../controllers/twilioController");

// Twilio sends POST requests to these webhooks
router.post("/twilio/voice", handleIncomingCall);
router.post("/twilio/gather", handleGather);
router.post("/twilio/status", handleCallStatus);

module.exports = router;

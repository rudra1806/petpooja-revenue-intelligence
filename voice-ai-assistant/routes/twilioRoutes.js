const express = require("express");
const router = express.Router();
const VoiceResponse = require("twilio").twiml.VoiceResponse;
const { parseOrder } = require("../controllers/orderController");

// ═══════════════════════════════════════════════════════
// 1. INCOMING CALL — Twilio hits this webhook
// ═══════════════════════════════════════════════════════
router.post("/voice", (req, res) => {
    const twiml = new VoiceResponse();

    twiml.say(
        { voice: "Polly.Aditi", language: "en-IN" },
        "Welcome to PetPooja! What would you like to order?"
    );

    // Start gathering speech
    const gather = twiml.gather({
        input: "speech",
        language: "en-IN",
        action: "/twilio/handle-speech",
        method: "POST",
        speechTimeout: "auto",
        speechModel: "experimental_conversations",
    });

    // If no speech detected, re-prompt
    twiml.say(
        { voice: "Polly.Aditi" },
        "I didn't hear anything. Please tell me your order."
    );
    twiml.redirect("/twilio/voice");

    res.type("text/xml");
    res.send(twiml.toString());
});

// ═══════════════════════════════════════════════════════
// 2. HANDLE SPEECH — receives transcribed text from Twilio
// ═══════════════════════════════════════════════════════
router.post("/handle-speech", async (req, res) => {
    const spokenText = req.body.SpeechResult;
    const confidence = req.body.Confidence;
    const callSid = req.body.CallSid; // unique per call = sessionId

    console.log(`📞 [Twilio ${callSid.slice(0, 8)}] Heard: "${spokenText}" (${confidence})`);

    const twiml = new VoiceResponse();

    if (!spokenText) {
        twiml.say({ voice: "Polly.Aditi" }, "Sorry, I didn't catch that. Please try again.");
        twiml.redirect("/twilio/voice");
        res.type("text/xml");
        return res.send(twiml.toString());
    }

    try {
        // Call existing parseOrder logic by simulating req/res
        const orderResult = await new Promise((resolve, reject) => {
            const fakeReq = {
                body: { text: spokenText, sessionId: callSid },
            };
            const fakeRes = {
                json: (data) => resolve(data),
                status: (code) => ({
                    json: (data) => resolve({ ...data, _statusCode: code }),
                }),
            };
            parseOrder(fakeReq, fakeRes).catch(reject);
        });

        // ── Order completed ──────────────────────────────
        if (orderResult.completed) {
            twiml.say(
                { voice: "Polly.Aditi" },
                orderResult.message || "Your order has been placed!"
            );
            twiml.say({ voice: "Polly.Aditi" }, "Thank you for ordering with PetPooja. Goodbye!");
            twiml.hangup();

            res.type("text/xml");
            return res.send(twiml.toString());
        }

        // ── Clarification needed ─────────────────────────
        if (orderResult.clarification) {
            twiml.say({ voice: "Polly.Aditi" }, orderResult.clarification);

            twiml.gather({
                input: "speech",
                language: "en-IN",
                action: "/twilio/handle-speech",
                method: "POST",
                speechTimeout: "auto",
            });

            res.type("text/xml");
            return res.send(twiml.toString());
        }

        // ── Normal response — speak + keep listening ─────
        const message = orderResult.message || "Added to your order.";
        twiml.say({ voice: "Polly.Aditi" }, message);

        // If there's an upsell, mention it
        if (orderResult.upsell) {
            twiml.say({ voice: "Polly.Aditi" }, orderResult.upsell);
        }

        twiml.say({ voice: "Polly.Aditi" }, "Anything else? Say finish order when you're done.");

        // Keep gathering
        twiml.gather({
            input: "speech",
            language: "en-IN",
            action: "/twilio/handle-speech",
            method: "POST",
            speechTimeout: "auto",
        });

        res.type("text/xml");
        res.send(twiml.toString());

    } catch (error) {
        console.error("❌ Twilio handler error:", error);
        twiml.say({ voice: "Polly.Aditi" }, "Sorry, something went wrong. Let's try again.");
        twiml.redirect("/twilio/voice");
        res.type("text/xml");
        res.send(twiml.toString());
    }
});

// ═══════════════════════════════════════════════════════
// 3. STATUS CALLBACK (optional — logs call events)
// ═══════════════════════════════════════════════════════
router.post("/status", (req, res) => {
    console.log(`📞 Call ${req.body.CallSid}: ${req.body.CallStatus}`);
    res.sendStatus(200);
});

module.exports = router;

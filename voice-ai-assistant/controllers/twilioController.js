const twilio = require("twilio");
const VoiceResponse = twilio.twiml.VoiceResponse;
const fs = require("fs");
const path = require("path");
const generateSpeech = require("../services/sarvamService");

// ── Reuse the core order-parsing logic ──────────────────────────────
const { parseOrder } = require("./orderController");

// ─────────────────────────────────────────────
// 1. INCOMING CALL  — Twilio hits this webhook
// ─────────────────────────────────────────────
exports.handleIncomingCall = async (req, res) => {
    console.log("📞 Incoming call from:", req.body.From);

    const twiml = new VoiceResponse();
    const greeting = "Welcome to our restaurant! What would you like to order?";

    // Try Sarvam TTS, fall back to basic Say
    const audioUrl = await generateTwilioAudio(greeting, req);

    const gather = twiml.gather({
        input: "speech",
        language: "en-IN",
        speechTimeout: "auto",
        action: "/twilio/gather",
        method: "POST"
    });

    if (audioUrl) {
        gather.play(audioUrl);
    } else {
        gather.say({ language: "en-IN" }, greeting);
    }

    // If no speech detected, loop back
    twiml.say({ language: "en-IN" }, "I didn't hear anything. Let me try again.");
    twiml.redirect("/twilio/voice");

    console.log("📞 TwiML response:", twiml.toString());

    res.type("text/xml");
    res.send(twiml.toString());
};

// ─────────────────────────────────────────────
// 2. GATHER RESULT  — Twilio sends transcribed speech
// ─────────────────────────────────────────────
exports.handleGather = async (req, res) => {
    const speechResult = req.body.SpeechResult;
    const callSid = req.body.CallSid;
    const callerPhone = req.body.From || callSid;

    console.log(`📞 [${callerPhone}] Caller said: "${speechResult}"`);

    if (!speechResult) {
        const twiml = new VoiceResponse();
        twiml.say({ language: "en-IN" }, "Sorry, I didn't catch that. Please try again.");
        twiml.redirect("/twilio/voice");
        res.type("text/xml");
        return res.send(twiml.toString());
    }

    const sessionId = callerPhone;

    try {
        const orderResponse = await callParseOrder(speechResult, sessionId);
        const twiml = new VoiceResponse();

        const message = orderResponse.message
            || orderResponse.clarification
            || "I'm not sure what you said. Could you try again?";

        console.log(`📞 Responding: "${message}"`);

        if (orderResponse.completed) {
            // Order complete — speak confirmation and hang up
            const fullMsg = message + " Thank you for your order! Goodbye.";
            const audioUrl = await generateTwilioAudio(fullMsg, req);
            if (audioUrl) twiml.play(audioUrl);
            else twiml.say({ language: "en-IN" }, fullMsg);
            twiml.hangup();
        } else {
            // Speak the response inside a Gather so we can listen for next input
            const audioUrl = await generateTwilioAudio(message, req);

            const gather = twiml.gather({
                input: "speech",
                language: "en-IN",
                speechTimeout: "auto",
                action: "/twilio/gather",
                method: "POST"
            });

            if (audioUrl) {
                gather.play(audioUrl);
            } else {
                gather.say({ language: "en-IN" }, message);
            }

            // If no speech, loop back
            twiml.say({ language: "en-IN" }, "I didn't hear anything.");
            twiml.redirect("/twilio/voice");
        }

        res.type("text/xml");
        res.send(twiml.toString());
    } catch (error) {
        console.error("❌ Twilio gather error:", error);
        const twiml = new VoiceResponse();
        twiml.say({ language: "en-IN" }, "Sorry, something went wrong. Please try again.");
        twiml.redirect("/twilio/voice");
        res.type("text/xml");
        res.send(twiml.toString());
    }
};

exports.handleCallStatus = (req, res) => {
    const { CallSid, CallStatus, From } = req.body;
    console.log(`📞 Call ${CallSid} from ${From}: ${CallStatus}`);
    res.sendStatus(200);
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function generateTwilioAudio(text, req) {
    try {
        const base64Audio = await generateSpeech(text);
        if (!base64Audio) return null;

        const fileName = `voice_${Date.now()}.wav`;
        const filePath = path.join(__dirname, "../public/audio", fileName);

        fs.writeFileSync(filePath, Buffer.from(base64Audio, "base64"));

        // Construct the URL. Twilio needs the full public URL (ngrok).
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        return `${protocol}://${req.headers.host}/audio/${fileName}`;
    } catch (error) {
        console.error("❌ Error generating Sarvam audio file:", error);
        return null;
    }
}

function callParseOrder(text, sessionId) {
    return new Promise((resolve, reject) => {
        const fakeReq = { body: { text, sessionId } };
        const fakeRes = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(data) {
                if (this.statusCode >= 400) reject(new Error(data.message || "Order parse error"));
                else resolve(data);
            }
        };
        parseOrder(fakeReq, fakeRes).catch(reject);
    });
}

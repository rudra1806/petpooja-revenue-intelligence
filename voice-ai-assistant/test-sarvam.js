require("dotenv").config({ path: "./.env" });
const { SarvamAIClient } = require("sarvamai");

async function test() {
    try {
        const client = new SarvamAIClient({
            apiSubscriptionKey: process.env.SARVAM_API_KEY
        });
        console.log("✅ Client created");

        const response = await client.textToSpeech.convert({
            text: "Hello, this is a test.",
            target_language_code: "en-IN",
            model: "bulbul:v3",
            speaker: "ritu"
        });

        console.log("✅ Success! Audio received:", response.audios?.length);
    } catch (error) {
        console.log("❌ Failed:", error.message);
        if (error.response) console.log("Response data:", error.response.data);
    }
}

test();


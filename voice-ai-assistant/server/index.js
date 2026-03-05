const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Voice AI Assistant Server Running");
});

app.post("/parse-order", async (req, res) => {
    const userText = req.body.text;

    console.log("User said:", userText);

    try {
        const response = await axios.post(
            "http://localhost:1234/v1/chat/completions",
            {
                model: "local-model",
                messages: [
                    {
                        role: "system",
                        content: `
                                You are a restaurant order parser.

                                Convert customer orders into structured JSON.

                                Output format:

                                {
                                "items":[
                                {
                                    "name":"item name",
                                    "quantity":number,
                                    "addons":[]
                                }
                                ]
                                }

                                Return ONLY valid JSON.
                                `
                    },
                    {
                        role: "user",
                        content: userText
                    }
                ],
                temperature: 0.2
            }
        );

        const aiReply = response.data.choices[0].message.content;

        let parsed;

        try {
            parsed = JSON.parse(aiReply);
        } catch {
            parsed = { raw: aiReply };
        }

        let upsell = null;

        if (parsed.items[0].name.toLowerCase().includes("pizza")) {
            upsell = "Customers often add garlic bread with pizza. Would you like to add it?";
        }

        res.json({
            order: parsed,
            upsell: upsell
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("LM Studio processing failed");
    }
});

app.listen(3001, () => {
    console.log("Server running on port 3001");
});
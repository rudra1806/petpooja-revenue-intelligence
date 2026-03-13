const { OpenAI } = require("openai");

const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_API_KEY
});

async function detectIntent(text) {
    try {
        const prompt = `
You are an intent classifier for a restaurant voice assistant.
Categorize the user input into one of the following intents:

- ORDER: User wants to order food, add items, or modify their order. (e.g., "I want a burger", "add two pizzas", "make it three")
- QUESTION: User is asking for information about items, prices, or recommendations. (e.g., "What burgers do you have?", "Suggest something spicy")
- NEGOTIATION: User is trying to negotiate price, ask for discounts, or suggesting a price for an item. (e.g., "can i get burger for 100", "give me discount", "burger at 50 rupees")
- DELETE: User wants to remove an item or cancel an order. (e.g., "remove the fries", "cancel my order")
- CONFIRM: User wants to finish and place the order. (e.g., "confirm order", "that's all")
- GREETING: General greetings or chat. (e.g., "hello", "how are you")

User sentence:
"${text}"

Answer ONLY with the intent name (ORDER, QUESTION, NEGOTIATION, DELETE, CONFIRM, GREETING).
`;

        const response = await client.chat.completions.create({
            model: "meta-llama/Llama-3.1-8B-Instruct:cerebras",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0
        });

        const intent = response.choices[0].message.content.trim().toUpperCase();

        // Basic validation to ensure it returns one of the expected intents
        const validIntents = ["ORDER", "QUESTION", "NEGOTIATION", "DELETE", "CONFIRM", "GREETING"];
        if (validIntents.includes(intent)) {
            return intent;
        }

        // Fallback: if it returns more text, try to extract the intent
        for (const valid of validIntents) {
            if (intent.includes(valid)) return valid;
        }

        return "ORDER"; // Default to ORDER if unsure, or "GREETING"

    } catch (error) {
        console.log("Intent detection failed:", error);
        return "ORDER";
    }
}

module.exports = detectIntent;

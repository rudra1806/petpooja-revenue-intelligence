const { OpenAI } = require("openai");

const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_API_KEY
});

async function menuAssistantAI(text, products, combos) {
    try {

        const menuItems = products
            .map(p => `${p.name} - ₹${p.selling_price} (${p.category || "food"})`)
            .join("\n");

        const comboItems = combos
            .map(c => `${c.combo_name} - ₹${c.combo_price}`)
            .join("\n");

        const prompt = `
You are a helpful restaurant assistant.

Answer user questions about the menu.

Menu Items:
${menuItems}

Combos:
${comboItems}

User question:
"${text}"

Rules:
- Answer naturally like a restaurant staff
- Suggest items from the menu
- Keep response short (1-3 sentences)
- Do NOT invent items that are not in the menu
`;

        const response = await client.chat.completions.create({
            model: "meta-llama/Meta-Llama-3-70B-Instruct",
            messages: [
                {
                    role: "system",
                    content: "You are a friendly restaurant menu assistant."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.4
        });

        return response.choices[0].message.content;

    } catch (err) {

        console.log("Menu AI error:", err.message);

        return "Sorry, I couldn't answer that right now.";
    }
}

module.exports = menuAssistantAI;
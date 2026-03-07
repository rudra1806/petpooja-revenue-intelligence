const axios = require("axios");

async function parseOrderWithAI(text, products) {
    try {
        const menu = products.map(p => p.name).join(", ");

        const prompt = `
You are a food ordering AI.

Menu:
${menu}

User said:
"${text}"

Return JSON only in this format:

{
 "items":[
   {
     "name":"product name",
     "quantity":1,
     "modifiers":[]
   }
 ]
}
`;

        const response = await axios.post(
            "http://localhost:1234/v1/chat/completions",
            {
                model: "meta-llama-3.1-8b-instruct",
                messages: [
                    {
                        role: "system",
                        content: "You are a restaurant order parser."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.1
            }
        );

        const aiText = response.data.choices[0].message.content;

        // Sometimes models wrap JSON in markdown blocks
        const cleanedJson = aiText.replace(/```json|```/g, "").trim();

        return JSON.parse(cleanedJson);

    } catch (error) {
        console.log("❌ LM Studio parsing failed");

        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }

        return null;   // fallback to Fuse logic
    }
}

module.exports = parseOrderWithAI;

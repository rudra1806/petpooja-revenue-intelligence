const { OpenAI } = require("openai");

const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_API_KEY
});

async function isQuestionAI(text) {

    try {

        const prompt = `
You are a classifier.

Determine if the user sentence is a QUESTION about a restaurant menu.

Examples:

"I want a burger" -> NO
"Give me 2 pizzas" -> NO
"What burgers do you have?" -> YES
"Suggest something spicy" -> YES
"Do you have vegetarian food?" -> YES
"Add fries" -> NO

User sentence:
"${text}"

Answer ONLY with YES or NO.
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

        const answer = response.choices[0].message.content
            .trim()
            .toLowerCase();

        return answer.includes("yes");

    } catch (error) {

        console.log("AI question detection failed:", error);
        return false;

    }
}

module.exports = isQuestionAI;
// const axios = require("axios");

// async function parseOrderWithAI(text, products){

//     try{

//         const menu = products.map(p => p.name).join(", ");

//         const prompt = `
// You are a food ordering AI.

// Menu:
// ${menu}

// User said:
// "${text}"

// Return JSON only in this format:
// {
//  "items":[
//    {
//      "name":"product name",
//      "quantity":1,
//      "modifiers":[]
//    }
//  ]
// }
// `;

//         const response = await axios.post(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
//             {
//                 contents: [
//                     {
//                         parts: [{ text: prompt }]
//                     }
//                 ]
//             }
//         );

//         const aiText = response.data.candidates[0].content.parts[0].text;

//         return JSON.parse(aiText);

//     }
//     catch(error){

//         console.log("❌ Gemini API failed");

//         if(error.response){
//             console.log("Status:", error.response.status);
//             console.log("Data:", error.response.data);
//         }

//         return null;   // important fallback
//     }
// }

// module.exports = parseOrderWithAI;





const axios = require("axios");

async function parseOrderWithAI(text, products) {

    try {

        const menu = products.map(p => p.name).join(", ");

        const prompt = `
You are a restaurant AI order parser.

Menu items:
${menu}

User order:
"${text}"

Return JSON only in this format:

{
  "items":[
    {
      "name":"burger",
      "quantity":2,
      "modifiers":["extra cheese"]
    }
  ]
}

If quantity not mentioned, assume 1.
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

        return JSON.parse(aiText);

    }
    catch (error) {

        console.log("❌ LM Studio parsing failed");

        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }

        return null;   // fallback to Fuse logic
    }
}

module.exports = parseOrderWithAI;
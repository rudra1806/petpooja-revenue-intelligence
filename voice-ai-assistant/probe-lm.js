const axios = require("axios");

async function probeLMStudio() {
    try {
        console.log("Probing LM Studio at http://localhost:1234/v1/models ...");
        const response = await axios.get("http://localhost:1234/v1/models");
        console.log("✅ LM Studio is reachable!");
        console.log("Available Models:");
        response.data.data.forEach(m => console.log(`- ${m.id}`));
    } catch (error) {
        console.log("❌ LM Studio probe failed.");
        if (error.code) console.log("Code:", error.code);
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        } else {
            console.log("Error Message:", error.message);
        }
    }
}

probeLMStudio();

const QUESTION_WORDS = [
    "which",
    "suggest",
    "recommend",
    "options",
    "menu",
    "vegetarian",
    "veg",
    "best",
    "popular",
    "spicy",
    "price",
    "cost",
    "available"
];

// Words that indicate ordering intent — skip question detection
const ORDER_INTENT_WORDS = [
    "give me",
    "i want",
    "i need",
    "order",
    "add",
    "get me",
    "i'll have",
    "ill have",
    "i will have",
    "can i have",
    "can i get",
    "please give",
    "one ",
    "two ",
    "three ",
    "four ",
    "five "
];

function isQuestion(text) {

    // If the user clearly wants to order something, don't treat as a question
    for (let phrase of ORDER_INTENT_WORDS) {
        if (text.includes(phrase)) {
            return false;
        }
    }

    if (text.includes("?")) return true;

    // "what" only counts as question if NOT an ordering phrase
    if (text.includes("what") && !text.includes("what i")) {
        return true;
    }

    for (let word of QUESTION_WORDS) {
        if (text.includes(word)) {
            return true;
        }
    }

    return false;
}

module.exports = isQuestion;
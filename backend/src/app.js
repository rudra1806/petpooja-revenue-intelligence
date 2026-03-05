const express = require("express");
const cors = require("cors");


const app = express();

app.use(express.json());

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to website",
        version: "1.0.0",
        status: true,
    });
});

module.exports = app;
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Middleware to protect routes.
 * Reads the JWT from the `auth_token` HTTP-only cookie,
 * verifies it, and attaches `req.user` for downstream handlers.
 */
const protect = async (req, res, next) => {
    try {
        const token = req.cookies && req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated. Please log in.",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info (lightweight – no DB hit unless needed)
        req.user = { id: decoded.id };

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
        }
        return res.status(401).json({ success: false, message: "Invalid token. Please log in." });
    }
};

module.exports = { protect };

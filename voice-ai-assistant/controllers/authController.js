const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// ─── Helpers ───────────────────────────────────────────────────────────────

const signToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_RE = /^\d{6}$/;

function validateAddress(address = {}) {
    const errors = [];
    if (!address.street || address.street.trim().length < 3) errors.push("Street address must be at least 3 characters.");
    if (!address.city || address.city.trim().length < 2) errors.push("City is required.");
    if (!address.state || address.state.trim().length < 2) errors.push("State is required.");
    if (!address.pincode || !PIN_RE.test(address.pincode.trim())) errors.push("Pincode must be a valid 6-digit number.");
    return errors;
}

// ─── Register ──────────────────────────────────────────────────────────────

const register = async (req, res) => {
    try {
        const { name, email, password, role = "user", address = {}, adminCode } = req.body;
        const errors = [];

        if (!name || name.trim().length < 2) errors.push("Name must be at least 2 characters.");
        if (!email || !EMAIL_RE.test(email)) errors.push("A valid email address is required.");
        if (!password || password.length < 6) errors.push("Password must be at least 6 characters.");
        if (!["user", "admin"].includes(role)) errors.push("Invalid role selected.");

        if (role === "admin") {
            if (!adminCode || adminCode.trim().toLowerCase() !== "petpooja") {
                errors.push("Invalid Admin Registration Code.");
            }
        }

        // Address is only required for regular users
        if (role === "user") {
            errors.push(...validateAddress(address));
        }

        if (errors.length) {
            return res.status(400).json({ success: false, message: errors[0], errors });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, message: "Email already registered." });
        }

        const userData = {
            name: name.trim(),
            email: email.toLowerCase(),
            password,
            role,
        };

        if (role === "user") {
            userData.address = {
                street: address.street.trim(),
                landmark: (address.landmark || "").trim(),
                city: address.city.trim(),
                state: address.state.trim(),
                pincode: address.pincode.trim(),
            };
        }

        const newUser = await User.create(userData);

        res.status(201).json({ success: true, message: "Registration successful! You can now log in." });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
};

// ─── Login ─────────────────────────────────────────────────────────────────

const login = async (req, res) => {
    try {
        const { email, password, role = "user" } = req.body;
        const errors = [];

        if (!email || !EMAIL_RE.test(email)) errors.push("A valid email address is required.");
        if (!password) errors.push("Password is required.");
        if (!["user", "admin"].includes(role)) errors.push("Invalid role selected.");

        if (errors.length) {
            return res.status(400).json({ success: false, message: errors[0], errors });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ success: false, message: "Invalid email or password." });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid email or password." });

        // ── Role check ──────────────────────────────────────────────────────
        // If user chose "admin" at login but their account is not admin → deny
        if (role === "admin" && user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not have admin privileges.",
            });
        }
        // If user chose "user" at login but their account is admin → deny
        // (admin must log in via the admin portal)
        if (role === "user" && user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin accounts must log in using the Admin role.",
            });
        }

        const token = signToken(user._id);
        res.cookie("auth_token", token, cookieOptions);

        res.json({
            success: true,
            message: "Login successful!",
            user: { id: user._id, name: user.name, email: user.email, role: user.role, address: user.address },
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
};

// ─── Logout ────────────────────────────────────────────────────────────────

const logout = (req, res) => {
    res.clearCookie("auth_token", { httpOnly: true, sameSite: "lax" });
    res.json({ success: true, message: "Logged out successfully." });
};

// ─── Update Profile (Protected) ────────────────────────────────────────────

const updateProfile = async (req, res) => {
    try {
        const { name, address = {} } = req.body;
        const errors = [];

        if (!name || name.trim().length < 2) errors.push("Name must be at least 2 characters.");

        const currentUser = await User.findById(req.user.id);
        if (currentUser?.role === "user") {
            errors.push(...validateAddress(address));
        }

        if (errors.length) {
            return res.status(400).json({ success: false, message: errors[0], errors });
        }

        const update = { name: name.trim() };
        if (currentUser?.role === "user") {
            update.address = {
                street: address.street.trim(),
                landmark: (address.landmark || "").trim(),
                city: address.city.trim(),
                state: address.state.trim(),
                pincode: address.pincode.trim(),
            };
        }

        const updated = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select("-password");
        if (!updated) return res.status(404).json({ success: false, message: "User not found." });

        res.json({ success: true, user: updated });
    } catch (err) {
        console.error("UpdateProfile error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

// ─── Get Current User (Protected) ──────────────────────────────────────────

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        res.json({ success: true, user });
    } catch (err) {
        console.error("GetMe error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

module.exports = { register, login, logout, getMe, updateProfile };

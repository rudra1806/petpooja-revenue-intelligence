const express = require("express");
const router = express.Router();

const { register, login, logout, getMe, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);  // Update name & address

module.exports = router;

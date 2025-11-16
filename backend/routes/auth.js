const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
    "/register",
    [
        body("name").trim().notEmpty().withMessage("Name is required"),
        body("email").isEmail().withMessage("Please enter a valid email"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    ],
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ message: "User already exists" });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create new user
            user = new User({
                name,
                email,
                password: hashedPassword
            });

            await user.save();

            // Create JWT token
            const payload = {
                user: {
                    id: user.id
                }
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "7d"
            });

            res.status(201).json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Please enter a valid email"),
        body("password").notEmpty().withMessage("Password is required")
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            // Create JWT token
            const payload = {
                user: {
                    id: user.id
                }
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "7d"
            });

            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// @route   GET /api/auth/me
// @desc    Get logged in user
// @access  Private
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
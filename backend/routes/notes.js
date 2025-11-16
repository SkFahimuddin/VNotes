const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Note = require("../models/Note");
const authMiddleware = require("../middleware/auth");

// @route   GET /api/notes
// @desc    Get all notes for logged in user
// @access  Private
router.get("/", authMiddleware, async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id }).sort({ date: -1 });
        res.json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/notes/:id
// @desc    Get a specific note
// @access  Private
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        // Check if user owns the note
        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        res.json(note);
    } catch (error) {
        console.error(error);
        if (error.kind === "ObjectId") {
            return res.status(404).json({ message: "Note not found" });
        }
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/notes
// @desc    Create a new note
// @access  Private
router.post(
    "/",
    [
        authMiddleware,
        body("title").trim().notEmpty().withMessage("Title is required"),
        body("content").trim().notEmpty().withMessage("Content is required")
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, date } = req.body;

        try {
            const newNote = new Note({
                user: req.user.id,
                title,
                content,
                date: date || Date.now()
            });

            const note = await newNote.save();
            res.status(201).json(note);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private
router.put(
    "/:id",
    [
        authMiddleware,
        body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
        body("content").optional().trim().notEmpty().withMessage("Content cannot be empty")
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, date } = req.body;

        try {
            let note = await Note.findById(req.params.id);

            if (!note) {
                return res.status(404).json({ message: "Note not found" });
            }

            // Check if user owns the note
            if (note.user.toString() !== req.user.id) {
                return res.status(401).json({ message: "Not authorized" });
            }

            // Update fields
            if (title) note.title = title;
            if (content) note.content = content;
            if (date) note.date = date;
            note.updatedAt = Date.now();

            await note.save();
            res.json(note);
        } catch (error) {
            console.error(error);
            if (error.kind === "ObjectId") {
                return res.status(404).json({ message: "Note not found" });
            }
            res.status(500).json({ message: "Server error" });
        }
    }
);

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        // Check if user owns the note
        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        await note.deleteOne();
        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error(error);
        if (error.kind === "ObjectId") {
            return res.status(404).json({ message: "Note not found" });
        }
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
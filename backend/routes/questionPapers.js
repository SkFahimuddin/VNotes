// backend/routes/questionPapers.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const QuestionPaper = require("../models/QuestionPaper");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");

// @route   GET /api/question-papers/search
// @desc    Search question papers with filters
// @access  Public
router.get("/search", async (req, res) => {
    try {
        const { 
            category, 
            schoolBoard, 
            class: className, 
            degree, 
            department, 
            semester,
            university,
            examName,
            subject,
            year,
            search
        } = req.query;

        let query = { isActive: true };

        // Category filter
        if (category) query.category = category;

        // School filters
        if (schoolBoard) query.schoolBoard = schoolBoard;
        if (className) query.class = parseInt(className);

        // College filters
        if (degree) query.degree = degree;
        if (department) query.department = { $regex: department, $options: "i" };
        if (semester) query.semester = parseInt(semester);
        if (university) query.university = { $regex: university, $options: "i" };

        // Exam filters
        if (examName) query.examName = { $regex: examName, $options: "i" };

        // Common filters
        if (subject) query.subject = { $regex: subject, $options: "i" };
        if (year) query.year = parseInt(year);

        // Text search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { subject: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } }
            ];
        }

        const questionPapers = await QuestionPaper.find(query)
            .populate("uploadedBy", "name email")
            .sort({ year: -1, createdAt: -1 })
            .limit(50);

        res.json(questionPapers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/question-papers/:id
// @desc    Get single question paper
// @access  Public
router.get("/:id", async (req, res) => {
    try {
        const questionPaper = await QuestionPaper.findById(req.params.id)
            .populate("uploadedBy", "name email");

        if (!questionPaper) {
            return res.status(404).json({ message: "Question paper not found" });
        }

        // Increment view count
        questionPaper.views += 1;
        await questionPaper.save();

        res.json(questionPaper);
    } catch (error) {
        console.error(error);
        if (error.kind === "ObjectId") {
            return res.status(404).json({ message: "Question paper not found" });
        }
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/question-papers
// @desc    Upload a new question paper with file
// @access  Private
router.post(
    "/",
    [
        authMiddleware,
        upload.single('file'), // Handle file upload
        body("title").trim().notEmpty().withMessage("Title is required"),
        body("category").isIn(["school", "college", "entrance_exam", "competitive_exam"])
            .withMessage("Invalid category"),
        body("subject").trim().notEmpty().withMessage("Subject is required"),
        body("year").isInt({ min: 1990, max: new Date().getFullYear() + 1 })
            .withMessage("Invalid year")
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Delete uploaded file if validation fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ errors: errors.array() });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }

        try {
            // Determine file type from mimetype
            let fileType = 'pdf';
            if (req.file.mimetype.startsWith('image/')) {
                fileType = 'image';
            } else if (req.file.mimetype.includes('word')) {
                fileType = 'doc';
            }

            // Parse tags if provided
            let tags = [];
            if (req.body.tags) {
                tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }

            const questionPaperData = {
                uploadedBy: req.user.id,
                title: req.body.title,
                description: req.body.description,
                category: req.body.category,
                subject: req.body.subject,
                year: parseInt(req.body.year),
                setNumber: req.body.setNumber || 'Set 1',
                fileUrl: `/uploads/question-papers/${req.file.filename}`,
                fileType: fileType,
                fileSize: req.file.size,
                tags: tags
            };

            // Add category-specific fields
            if (req.body.schoolBoard) questionPaperData.schoolBoard = req.body.schoolBoard;
            if (req.body.class) questionPaperData.class = parseInt(req.body.class);
            if (req.body.degree) questionPaperData.degree = req.body.degree;
            if (req.body.department) questionPaperData.department = req.body.department;
            if (req.body.semester) questionPaperData.semester = parseInt(req.body.semester);
            if (req.body.university) questionPaperData.university = req.body.university;
            if (req.body.examName) questionPaperData.examName = req.body.examName;
            if (req.body.examType) questionPaperData.examType = req.body.examType;

            const questionPaper = new QuestionPaper(questionPaperData);
            await questionPaper.save();
            
            const populated = await QuestionPaper.findById(questionPaper._id)
                .populate("uploadedBy", "name email");

            res.status(201).json(populated);
        } catch (error) {
            // Delete uploaded file if database save fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// @route   PUT /api/question-papers/:id
// @desc    Update a question paper
// @access  Private (only uploader)
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        let questionPaper = await QuestionPaper.findById(req.params.id);

        if (!questionPaper) {
            return res.status(404).json({ message: "Question paper not found" });
        }

        // Check ownership
        if (questionPaper.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Update fields
        const allowedUpdates = [
            "title", "description", "subject", "year", "setNumber",
            "schoolBoard", "class", "degree", "department", "semester",
            "university", "examName", "examType", "tags"
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                questionPaper[field] = req.body[field];
            }
        });

        questionPaper.updatedAt = Date.now();
        await questionPaper.save();

        const populated = await QuestionPaper.findById(questionPaper._id)
            .populate("uploadedBy", "name email");

        res.json(populated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   DELETE /api/question-papers/:id
// @desc    Delete a question paper
// @access  Private (only uploader)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const questionPaper = await QuestionPaper.findById(req.params.id);

        if (!questionPaper) {
            return res.status(404).json({ message: "Question paper not found" });
        }

        // Check ownership
        if (questionPaper.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Delete the file from filesystem
        if (questionPaper.fileUrl && !questionPaper.fileUrl.startsWith('http')) {
            const filePath = path.join(__dirname, '..', questionPaper.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await questionPaper.deleteOne();
        res.json({ message: "Question paper deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   PUT /api/question-papers/:id/download
// @desc    Increment download count
// @access  Public
router.put("/:id/download", async (req, res) => {
    try {
        const questionPaper = await QuestionPaper.findById(req.params.id);

        if (!questionPaper) {
            return res.status(404).json({ message: "Question paper not found" });
        }

        questionPaper.downloads += 1;
        await questionPaper.save();

        res.json({ message: "Download count updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/question-papers/my/uploads
// @desc    Get user's uploaded question papers
// @access  Private
router.get("/my/uploads", authMiddleware, async (req, res) => {
    try {
        const questionPapers = await QuestionPaper.find({ 
            uploadedBy: req.user.id 
        }).sort({ createdAt: -1 });

        res.json(questionPapers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/question-papers/stats/summary
// @desc    Get statistics summary
// @access  Public
router.get("/stats/summary", async (req, res) => {
    try {
        const stats = await QuestionPaper.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    totalDownloads: { $sum: "$downloads" }
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;

// Additional route to get file directly (for download)
router.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, '..', 'uploads', 'question-papers', req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ message: 'File not found' });
    }
});
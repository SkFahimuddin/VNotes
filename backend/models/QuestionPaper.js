// backend/models/QuestionPaper.js
const mongoose = require("mongoose");

const QuestionPaperSchema = new mongoose.Schema({
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ["school", "college", "entrance_exam", "competitive_exam"]
    },
    
    // School specific fields
    schoolBoard: {
        type: String,
        enum: ["CBSE", "ICSE", "State Board", "IB", "Other"]
    },
    class: {
        type: Number,
        min: 1,
        max: 12
    },
    
    // College specific fields
    degree: {
        type: String,
        enum: ["undergraduate", "postgraduate", "diploma"]
    },
    department: {
        type: String,
        trim: true
    },
    semester: {
        type: Number,
        min: 1,
        max: 10
    },
    university: {
        type: String,
        trim: true
    },
    
    // Entrance/Competitive exam fields
    examName: {
        type: String,
        trim: true
    },
    examType: {
        type: String,
        enum: ["entrance", "competitive", "certification"]
    },
    
    // Common fields
    subject: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true,
        min: 1990,
        max: new Date().getFullYear() + 1
    },
    setNumber: {
        type: String,
        trim: true,
        default: "Set 1"
    },
    
    // File information
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ["pdf", "image", "doc"],
        default: "pdf"
    },
    fileSize: {
        type: Number // in bytes
    },
    
    // Engagement metrics
    downloads: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    
    // Status
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    tags: [{
        type: String,
        trim: true
    }],
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient searching
QuestionPaperSchema.index({ category: 1, year: -1 });
QuestionPaperSchema.index({ subject: 1 });
QuestionPaperSchema.index({ schoolBoard: 1, class: 1 });
QuestionPaperSchema.index({ university: 1, department: 1, semester: 1 });
QuestionPaperSchema.index({ examName: 1 });
QuestionPaperSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model("QuestionPaper", QuestionPaperSchema);
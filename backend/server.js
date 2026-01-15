// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();

const connectDB = require("./db");

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/question-papers', require('./routes/questionPapers'));

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'VNotes API is running!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
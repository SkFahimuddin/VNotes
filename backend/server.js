const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const connectDB = require("./db");

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'VNotes API is running!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
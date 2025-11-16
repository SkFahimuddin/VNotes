const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MongoDB_URL);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("DB Error:", error);
    }
};

module.exports = connectDB;

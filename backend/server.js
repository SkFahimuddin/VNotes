const express = require('express');
const app = express();
require('dotenv').config();

const connectDB = require("./db");

app.use(express.json());

connectDB();

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

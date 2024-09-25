const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.MONGO_URI;

mongoose
    .connect(URI)
    .then(() => console.log('DB is Up!'))
    .catch((err) => console.log('DB connection error:', err));
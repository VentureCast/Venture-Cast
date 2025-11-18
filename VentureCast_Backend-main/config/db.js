const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        // Use environment variable for MongoDB URI, fallback to localhost for non-Docker development
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/venture-cast-backend';

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("MongoDB connected successfully");
        console.log("Database:", mongoose.connection.name);
    } catch (err) {
        console.error("MongoDB connection error:", err);
        // Retry connection after 5 seconds for Docker startup timing
        console.log("Retrying MongoDB connection in 5 seconds...");
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;
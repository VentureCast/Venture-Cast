const mongoose = require("mongoose");
const logger = require("../utils/logger");

const MAX_RETRIES = 5;
let retryCount = 0;

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/venture-cast-backend';

        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        retryCount = 0;
        logger.info("MongoDB connected successfully");
        logger.info(`Database: ${mongoose.connection.name}`);
    } catch (err) {
        retryCount++;
        logger.error("MongoDB connection error:", { error: err.message, attempt: retryCount });

        if (retryCount >= MAX_RETRIES) {
            logger.error(`Failed to connect after ${MAX_RETRIES} attempts. Exiting.`);
            process.exit(1);
        }

        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 16000);
        logger.info(`Retrying MongoDB connection in ${delay / 1000}s (attempt ${retryCount}/${MAX_RETRIES})...`);
        setTimeout(connectDB, delay);
    }
};

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error (post-connect):', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});

module.exports = connectDB;

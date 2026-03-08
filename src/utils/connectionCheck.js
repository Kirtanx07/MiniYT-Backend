import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

export const checkConnections = async () => {
    console.log("\n📡 TESTING EXTERNAL SERVICES...");
    let health = { mongo: false, cloudinary: false };

    // 1. Test MongoDB
    try {
        // We check if the connection state is 1 (connected)
        if (mongoose.connection.readyState === 1) {
            health.mongo = true;
            console.log("✅ MongoDB: Connected and Ready");
        } else {
            throw new Error("Mongoose connection not active");
        }
    } catch (error) {
        console.error("❌ MongoDB: Connection Failed ->", error.message);
    }

    // 2. Test Cloudinary
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        
        const result = await cloudinary.api.ping();
        if (result.status === 'ok') {
            health.cloudinary = true;
            console.log("✅ Cloudinary: Authenticated and Ready");
        }
    } catch (error) {
        console.error("❌ Cloudinary: Authentication Failed. Check your .env keys.");
    }

    // Fatal Exit if either fails
    if (!health.mongo || !health.cloudinary) {
        console.error("\n🛑 CRITICAL SERVICE FAILURE. Server shutting down.");
        process.exit(1);
    }

    console.log("🚀 ALL SYSTEMS GO\n");
};
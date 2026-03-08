import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const healthcheck = asyncHandler(async (req, res) => {
    // 1. Check MongoDB Connection State
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";

    // 2. Check Cloudinary Connection
    let cloudinaryStatus = "Disconnected";
    try {
        const result = await cloudinary.api.ping();
        if (result?.status === "ok") {
            cloudinaryStatus = "Connected";
        }
    } catch (error) {
        cloudinaryStatus = "Error: Unable to reach Cloudinary";
    }

    // 3. Overall Health Logic
    const isHealthy = dbStatus === "Connected" && cloudinaryStatus === "Connected";

    if (!isHealthy) {
        return res
            .status(503) // Service Unavailable
            .json(
                new ApiResponse(
                    503,
                    { dbStatus, cloudinaryStatus },
                    "System is unhealthy"
                )
            );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    status: "OK",
                    dbStatus,
                    cloudinaryStatus,
                    uptime: process.uptime(), // Bonus: tells you how long the server has been running
                    timestamp: Date.now()
                },
                "All systems functional"
            )
        );
});

export { healthcheck };

import mongoose from "mongoose";
import { Video } from "../../models/video.model.js";
import { Subscription } from "../../models/subscription.model.js";
import { Like } from "../../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    const stats = await Video.aggregate([
        {
            // 1. Match videos belonging to the channel owner
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            // 2. Lookup likes for each video
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            // 3. Group data to calculate totals
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 },
                totalLikes: {
                    $sum: { $size: "$likes" }
                }
            }
        },
        {
            // 4. Project clean output
            $project: {
                _id: 0,
                totalViews: 1,
                totalVideos: 1,
                totalLikes: 1
            }
        }
    ]);

    // 5. Get Subscriber count (Separate query for better performance)
    const totalSubscribers = await Subscription.countDocuments({
        channel: userId
    });

    // Format the final response object
    const channelStats = {
        totalViews: stats[0]?.totalViews || 0,
        totalVideos: stats[0]?.totalVideos || 0,
        totalLikes: stats[0]?.totalLikes || 0,
        totalSubscribers: totalSubscribers || 0
    };

    return res
        .status(200)
        .json(new ApiResponse(200, channelStats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    const videos = await Video.find({
        owner: userId
    }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                videos, 
                videos.length === 0 ? "No videos found" : "Videos fetched successfully"
            )
        );
});

export {
    getChannelStats,
    getChannelVideos
};

import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../../models/video.model.js"
import { User } from "../../models/user.model.js"
import { Like } from "../../models/like.model.js"
import { Comment } from "../../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    // TODO: get all videos based on query, sort, pagination
    
    const pipeline = [];

    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query } }, 
                    { description: { $regex: query } }
                ]
            }
        });
    }

    if (userId) {
        pipeline.push({ 
            $match: { owner: new mongoose.Types.ObjectId(userId) } 
        });
    }

    const sortField = sortBy || "createdAt";
    const direction = sortType === "asc" ? 1 : -1;
    pipeline.push({ $sort: { [sortField]: direction } });

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title and Description are required");
    }

    const videolocalPath = req.files?.video?.[0]?.path;
    const thumbnaillocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videolocalPath || !thumbnaillocalPath) {
        throw new ApiError(400, "Video and Thumbnail files are required!");
    }

    const videoUpload = await uploadOnCloudinary(videolocalPath);
    const thumbnailUpload = await uploadOnCloudinary(thumbnaillocalPath);

    if (!videoUpload) {
        throw new ApiError(400, "Error while uploading video to Cloudinary")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoUpload.url,  
        thumbnail: thumbnailUpload.url,  
        owner: req.user._id,  
        duration: videoUpload.duration || 0,  
        isPublished: true
    });

    return res.status(201).json(
        new ApiResponse(201, video, "Video Uploaded Successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // TODO: get video by id
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID format");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    // TODO: update video details like title, description, thumbnail
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    const thumbnailLocalPath = req.file?.path
    if (thumbnailLocalPath) {
        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
        if (!thumbnailUpload.url) {
            throw new ApiError(400, "Error while uploading thumbnail");
        }
        updateData.thumbnail = thumbnailUpload.url;
    }

    const videoUpdate = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true }
    );

    if (!videoUpdate) {
        throw new ApiError(404, "Video not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videoUpdate, "Video updated successfully!"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // TODO: delete video
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorized request");
    }

    await deleteFromCloudinary(video.videoFile, "video");
    await deleteFromCloudinary(video.thumbnail, "image");

    await Like.deleteMany({ video: videoId });
    await Comment.deleteMany({ video: videoId });

    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // TODO: toggle publish status
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorized request");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, video.isPublished, "Status toggled successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    
    const aggregatePipeline = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            
            $lookup: {
                from: "user",
                localField: "owner",
                foreignField: "_id",
                as: "commenter",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            
            $addFields: {
                commenter: { $first: "$commenter" }
            }
        },
        {
            
            $sort: {
                createdAt: -1
            }
        }
    ]);


    const options = {
        page: parseInt(page || 1),
        limit: parseInt(limit || 10),
    };

    const comments = await Comment.aggregatePaginate(aggregatePipeline, options);

    if (!comments || comments.docs.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "No comments found for this video"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
   
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {newcomment} = req.body
    const { videoId } = req.params;
    const valid = isValidObjectId(videoId)
    if (!valid) {
        throw new ApiError(400,"Invalid Video ID for comment")
        
    }
    if (newcomment==="") {
        throw new ApiError(400,"comment should not be empty")
        
    }
    const createcomment = await Comment.create({
        content: newcomment,
        video: videoId,
        owner : req.user?._id

    })

    if (!createcomment) {
        throw new ApiError(500, "Something went wrong while commenting");
    }

    return res.status(201).json(
        new ApiResponse(201, createcomment, "Comment Successfull"))
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {newcomment} = req.body
    const { commentId } = req.params;
    if (newcomment==="") {
        throw new ApiError(400,"comment should not be empty")}
    
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this comment");
    }

    const updatecomment = await comment.findByIdAndUpdate(
            commentId,
            {
                $set:{
                    content : newcomment
                }
            },
            {
                new : true
            }
        )
    
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {updateCommentcomment},
                "Comment updated successfully"
            )
        )    
    
        
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if (newcomment==="") {
        throw new ApiError(400,"comment should not be empty")}
    
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this comment");}

    const deletedcomment = comment.findByIdAndDelete(commentId)
    if (!deleteCommentcomment) {
        throw new ApiError(404, "Comment not Deleted");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comment updated successfully"
            )
        )    


})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }

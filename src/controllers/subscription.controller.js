import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../../models/user.model.js"
import { Subscription } from "../../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const existSub = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if (!existSub) {
        // Create subscription
        await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })

        return res
            .status(200)
            .json(new ApiResponse(200, { isSubscribed: true }, "Channel subscribed successfully"))
    } else {
        // Remove subscription
        await Subscription.findByIdAndDelete(existSub._id)

        return res
            .status(200)
            .json(new ApiResponse(200, { isSubscribed: false }, "Channel unsubscribed successfully"))
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: return subscriber list of a channel

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users", // the collection name for User model
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetail",
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
                subscriberDetail: { $first: "$subscriberDetail" }
            }
        },
        {
            $project: {
                subscriberDetail: 1,
                createdAt: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, subscriberList, "Subscribers fetched successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    // TODO: return channel list to which user has subscribed

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscribedTo = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
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
                subscribedChannel: { $first: "$subscribedChannel" }
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, subscribedTo, "Subscribed channels fetched successfully"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}

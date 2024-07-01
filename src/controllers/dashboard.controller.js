import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    try {

        const getChannelStats = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $group: {
                    _id: null,
                    totalVideos: { $sum: 1 },
                    totalViews: { $sum: "$views" },
                    totalLikes: { $sum: "$likes" },
                    totalSubscribers: { $sum: "$subscribers" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalViews: 1,
                    totalLikes: 1,
                    totalSubscribers: 1,
                    totalVideos: 1
                }
            }
        ])

        if (!getChannelStats) {
            return res.status(404).json(new ApiResponse(404, null, "Channel stats not found"))
        }

        return res.status(200).json(new ApiResponse(200, getChannelStats[0], "Channel stats fetched successfully"))

    } catch (error) {
        console.log("error at getChannelStats", error);
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    try {
        const getAllVideos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user._id)
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    thumbnail: 1,
                    views: 1,
                    isPublished: 1,
                    owner: 1
                }
            }
        ])
        if (getAllVideos) {
            return res
                .status(200)
                .json(new ApiResponse(200, getAllVideos, "Videos fetched successfully"))
        }
        return res
            .status(404)
            .json(new ApiResponse(404, null, "Videos not found"))
    } catch (error) {
        console.log("error at getChannelVideos", error);
    }
})

export {
    getChannelStats,
    getChannelVideos
}
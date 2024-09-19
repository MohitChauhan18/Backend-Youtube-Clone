import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    try {
        const {channelId} = req.params
        // TODO: toggle subscription
        if (!isValidObjectId(channelId)) {
            throw new ApiError(400,"Invalid channel Id")
        }
        const findSub = await Subscription.findOne(
            {$and:[{subscriber:req.user?._id},{channel:channelId}]}
        )
        if (!findSub) {
            const subscribed = await Subscription.create(
                {
                    subscriber:req.user?._id,
                    channel:channelId
                }
            )
            if (!subscribed) {
                throw new ApiError(
                    400,
                    "Error while Toggle Subscriber"
                )
            }
            return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    subscribed,
                    "Subscribed to channel"
                )
            )    
        }
        const unSub = await Subscription.findByIdAndDelete({
            subscriber: req.user?._id,
            channel:channelId
        })
        if (!unSub) {
            throw new ApiError(
                400,
                "Error while unsubbing"
            )
        }
        return res
        .status(204)
        .json(
            new ApiResponse(
                200,
                null,
                "UnSubed from Channel"
            )
        )
    } catch (error) {
        throw new ApiError(
            400,
            error.message || "Error while Toggle Subscription"
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
   try {
     const {channelId} = req.params
     if (!isValidObjectId(channelId)) {
        throw new ApiError(400,"Invalid channelId")
     }
     const channelList = await Subscription.aggregate([
         {
             $match:{
                 channel:new mongoose.Types.ObjectId(channelId)
             }
         },
         {
             $lookup:{
                 from:"users",
                 foreignField:"_id",
                 localField:"subscriber",
                 as:"subscriber"
             }
         },
     ])
     if (!channelList) {
         throw new ApiError(
             400,
             "Error while getting subscribers List"
         )
     }
     return res
     .status(200)
     .json(
         new ApiResponse(
             200,
             channelList[0],
             "Fetched Subscriber list"
         )
     )
   } catch (error) {
    throw new ApiError(
        400,
        error.message || "Error in get User Channel Subscribers"
    )
   }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    try {
        const { subscriberId } = req.params
        if (!isValidObjectId) {
            throw new ApiError(400,"Invalid subscriberId")
        }
        const channelList = await Subscription.aggregate([
            {
                $match:{
                    subscriber:new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    foreignField:"_id",
                    localField:"channel",
                    as:"channel"
                }
            }
        ])
        if (!channelList) {
            throw new ApiError(
                400,
                "Error while getting My subscribed List"
            )
        }
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelList,
                "Fetched  My Subscribed list"
            )
        )
      } catch (error) {
       throw new ApiError(
           400,
           error.message || "Error in get Subscribers channel"
       )
      }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
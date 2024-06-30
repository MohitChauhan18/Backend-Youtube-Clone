import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId) throw new ApiError(400, "channelId is a required argumnet")

    if(!isValidObjectId(channelId)) throw new ApiError(400, "Invalid object Id")

    const channelSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    })

    let toggleSubscription

    if(channelSubscription){
        toggleSubscription = await Subscription.deleteOne({
            channel: channelId,
            subscriber: req.user._id
        })
    }
    else{
        toggleSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
    }

    if(!toggleSubscription) throw new ApiError(400, "something went wrong", toggleSubscription)

    res.status(200)
    .json(new ApiResponse(200, toggleSubscription, "Toggle channel subscription"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId) throw new ApiError(400, "channelId is a required argumnet")

    if(!isValidObjectId(channelId)) throw new ApiError(400, "Invalid object Id")

    const subscriberList = await Subscription.aggregate([
        {
           $match : {
               channel : new mongoose.Types.ObjectId(channelId)
           } 
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
            }
        },
        {
            $project: {
                subscribers:{
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ])

    res.status(200)
    .json(new ApiResponse(200, subscriberList[0], "Subscriber list fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId) throw new ApiError(400, "subscriberId is a required argumnet")

    if(!isValidObjectId(subscriberId)) throw new ApiError(400, "Invalid object Id")

    const subscribedChannelList = await Subscription.aggregate([
        {
           $match : {
            subscriber  : new mongoose.Types.ObjectId(subscriberId)
           } 
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
            }
        },
        {
            $project: {
                subscribedChannel:{
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ])

    res.status(200)
    .json(new ApiResponse(200, subscribedChannelList[0], "list fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
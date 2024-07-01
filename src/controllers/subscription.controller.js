import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    try {


        const getsubscriptions = await Subscription.findOne({
            subscriber: req.user._id,
            channel: channelId
        })

        if (getsubscriptions) {

            const deleteSubscriptions = await Subscription.findByIdAndDelete(getsubscriptions._id)

            if (deleteSubscriptions) {
                return res
                    .status(201)
                    .json(
                        new ApiResponse(201, deleteSubscriptions, "Subscription deleted successfully")
                    )
            }
        }

        const insertsubscriptions = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })

        if (insertsubscriptions) {
            return res
                .status(201)
                .json(
                    new ApiResponse(201, insertsubscriptions, "Subscription created successfully")
                )
        }

        return res
            .status(500)
            .json(new ApiResponse(500, null, "Something went wrong at creating subscription"))

    } catch (error) {

        console.log("error", error);
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    console.log("channelId", channelId);

    try {

        const getSubscriberList = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriber"
                }
            },
            {
                $unwind: "$subscriber"
            },
            {
                $facet: {
                    subscribers: [
                        {
                            $project: {
                                _id: 1,
                                "subscriber._id": 1,
                                "subscriber.username": 1,
                                "subscriber.fullName": 1,
                                "subscriber.avatar": 1

                            }
                        }
                    ],
                    totalCount: [
                        {
                            $count: "count"
                        }
                    ]
                }
            }
        ]);


        if (getSubscriberList) {
            return res
                .status(201)
                .json(
                    new ApiResponse(201, getSubscriberList, "successfully fetched subscriber list")
                )
        }

        return res
            .status(500)
            .json(new ApiResponse(500, null, "Something went wrong at fetching subscriber list"))

    } catch (error) {
        console.log("error at getUserChannelSubscribers", error);
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params


    // TODO: get subscribed channels

    try {

        const getsubscriptions = await Subscription.aggregate([
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
                    as: "channel"
                }
            },
            {
                $unwind: "$channel"
            },
            {
                $project: {
                    _id: 1,
                    "channel._id": 1,
                    "channel.fullname": 1,
                    "channel.avatar": 1,
                    "channel.username": 1

                }
            }
        ])

        if (getsubscriptions) {
            return res
                .status(201)
                .json(
                    new ApiResponse(201, getsubscriptions, "Subscription deleted successfully")
                )
        }

        return res
            .status(500)
            .json(new ApiResponse(500, null, "Something went wrong at creating subscription"))

    } catch (error) {
        console.log("error at getSubscribedChannels", error);
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
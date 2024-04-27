import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyId } from "../utils/verifyId.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const verifiedChannelId = verifyId(channelId);
  const response = await User.findById(channelId);

  if (!response) {
    throw new ApiError(400, "Channel Not Found");
  }

  let message;

  const checkAndDelete = await Subscription.findOneAndDelete({
    $and: [
      {
        channel: verifiedChannelId,
      },
      {
        subscriber: req?.user?._id,
      },
    ],
  });

  if (checkAndDelete) {
    message = "Unsubscribed from channel successfully";
  } else {
    await Subscription.create({
      subscriber: req?.user?._id,
      channel: verifiedChannelId,
    });
    message = "Subscribed to channel successfully";
  }

  res.status(200).json(new ApiResponse(200, message));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const verifiedChannelId = verifyId(channelId);
  const checkChannelExist = await User.findById(verifiedChannelId);
  if (!checkChannelExist) {
    throw new ApiError(400, "Channel Not Found");
  }
  const response = await Subscription.aggregate([
    {
      $match: {
        channel: verifiedChannelId,
      },
    },
    // {
    //     $addFields:{
    //         subscriberId:"$subscriber"
    //     }
    // }
    {
      $lookup: {
        localField: "subscriber",
        from: "users",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriber: {
          $first: "$subscriber",
        },
        isSubscribe: { // Add the isSubscribe flag
            $eq: ["$subscriber._id", req.user?._id], // Check if the current user is the subscriber
          },
      },
    },
    {
      $project: {
        subscriber: 1,
        isSubscribe:1
      },
    },
  ]);
  res.status(200).json(new ApiResponse(200, response));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const verifiedsubscriberId = verifyId(subscriberId);
  const checksubscriberExist = await User.findById(verifiedsubscriberId);
  if (!checksubscriberExist) {
    throw new ApiError(400, "Channel Not Found");
  }
  const response=await Subscription.aggregate([
   {$match:{subscriber:verifiedsubscriberId}}
  ])
  res.status(200).json(new ApiResponse(200,response))
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createSubscriptionDoc = asyncHandler(async (req, res) => {
  const { channel } = req.body;

  if (!isValidObjectId(channel)) {
    throw new ApiError(400, "Invalid Channel");
  }

  if (req.user._id.equals(channel)) {
    throw new ApiError(400, "Invalid request");
  }

  const subscribed = await Subscription.findOne({
    $and: [{ channel }, { subscriber: req.user._id }],
  });

  if (subscribed) {
    throw new ApiError(400, "already subscribed");
  }

  const subscription = await Subscription.create({
    subscriber: req.user._id,
    channel,
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, subscription, "Channel subscribed successfully")
    );
});

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  // Done

  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel");
  }

  if (req.user._id.equals(channelId)) {
    throw new ApiError(400, "Invalid request");
  }

  const subscribed = await Subscription.findOne({
    $and: [{ channel: channelId }, { subscriber: req.user._id }],
  });

  if (!subscribed) {
    const subscription = await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, subscription, "Channel subscribed successfully")
      );
  } else {
    await Subscription.deleteOne({
      $and: [{ channel: channelId }, { subscriber: req.user._id }],
    });

    res.status(200).json(new ApiResponse(200, {}, "Channel Unsubsscribed"));
  }
});

// controller to return subscriber list of a channel
// Done
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
              email: 1,
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
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscriber list feched succesfully")
    );
});

// controller to return channel list to which user has subscribed
// Done
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Channel");
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        channel: {
          $first: "$channel",
        },
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, channels, "Channel list feched succesfully"));
});

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
  createSubscriptionDoc,
};

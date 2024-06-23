import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;
  try {
    if (!mongoose.isValidObjectId(channelId)) {
      return res
        .status(400)
        .json(new ApiError(400, "Invalid Channel ID: " + channelId));
    }

    if (req.user._id === channelId) {
      throw new ApiError(400, "You cannot subscibe to yourself");
    }

    // TODO: toggle subscription
    const existingSubscription = await subscription.findOne({
      subscriber: userId,
      channel: channelId,
    });

    if (existingSubscription) {
      await subscription.findOneAndDelete({
        subscriber: userId,
        channel: channelId,
      });
    } else {
      const subscribe = await new subscription({
        subscriber: userId,
        channel: channelId,
      });
      await subscribe.save();
    }

    const subscriber = await User.findById(req.user._id);
    const isSubscribed = existingSubscription ? false : true;
    const totalSubscribers = await subscription.countDocuments({
      channel: channelId,
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { totalSubscribers, isSubscribed, subscriber },
          "Subscription is toggled successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, "Error while subscribing to the channel" + error);
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  try {
    if (!mongoose.isValidObjectId(channelId)) {
      throw new ApiError(400, "Invalid channel id");
    }
    console.log(channelId);

    const user = await User.find({ _id: channelId });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const getUserChannelSubscribers = await subscription.find({
      channel: channelId,
    });

    if (!getUserChannelSubscribers) {
      throw new ApiError(400, "No user channel Subscribers found");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          getUserChannelSubscribers,
          "Channel Subscribers Successfully Fetched"
        )
      );
  } catch (error) {
    throw new ApiError(
      400,
      "error while fetching list of subscribed channels",
      error
    );
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  console.log(subscriberId);

  if (!mongoose.isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber Id");
  }

  const user = await User.findById({ _id: subscriberId });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const subscribedChannels = await subscription.find({
    subscriber: subscriberId,
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Channel Subscribers Successfully Fetched"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

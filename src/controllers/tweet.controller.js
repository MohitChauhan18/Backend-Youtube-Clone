import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  console.log(content);

  const tweet = await Tweet.create({ content, owner: req.user._id });
  if (!tweet) {
    throw new ApiError(401, "Error creating tweet");
  }
  res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return new ApiError(400, "Invalid video ID");
  }

  const tweet = await Tweet.find({ owner: userId });
  if (!tweet) {
    throw new ApiError(401, "User not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, tweet, "User tweet fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    return new ApiError(400, "Invalid Tweet ID");
  }
  const tweet = await Tweet.findOneAndUpdate(
    { _id: tweetId },
    {
      content,
    },
    { new: true }
  );
  if (!tweet) {
    throw new ApiError(401, "Tweet not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, tweet, " Tweet Updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    return new ApiError(400, "Invalid Tweet ID");
  }
  const tweet = await Tweet.findOneAndDelete(tweetId);
  if (!tweet) {
    throw new ApiError(401, "Tweet not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, tweet, " Tweet Deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

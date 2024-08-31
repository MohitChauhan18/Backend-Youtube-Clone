import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  // Done
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  res
    .status(201)
    .json(new ApiResponse(200, tweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  //Done
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid UserId");
  }

  const tweets = await Tweet.find({
    owner: new mongoose.Types.ObjectId(userId),
  });

  res
    .status(200)
    .json(new ApiResponse(200, tweets, "tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;

  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "invalid tweet");
  }

  if (!content) {
    throw new ApiError(400, "please provide content");
  }

  const tweet = await Tweet.findOne({
    $and: [
      { owner: new mongoose.Types.ObjectId(req.user._id) },
      { _id: tweetId },
    ],
  });

  if (!tweet) {
    throw new ApiError(400, "unauthorized request");
  }

  tweet.content = content;

  const newTweet = await tweet.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, newTweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  // Done
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "invalid tweet");
  }

  const tweet = await Tweet.findOne({
    $and: [
      { owner: new mongoose.Types.ObjectId(req.user._id) },
      { _id: tweetId },
    ],
  });

  if (!tweet) {
    throw new ApiError(400, "unauthorized request");
  }

  await Tweet.findByIdAndDelete(tweet._id);

  res.status(200).json(new ApiResponse(200, {}, "tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

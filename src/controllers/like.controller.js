import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  const userId = req.user._id;

  const existingLike = await Like.findOne({
    likedBy: userId,
    video: videoId,
    
  });

  if (existingLike) {
    // User has already liked the video, so we should remove the like
    await Like.findByIdAndDelete(existingLike._id);
    res.status(200).json({ message: "Like removed successfully" });
  } else {
    // User has not liked the video, so we should add a new like
    const newLike = new Like({ likedBy: userId, video: videoId });
    await newLike.save();
    res.status(200).json({ message: "Video liked successfully" });
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const userId = req.user._id;

  const existingComment = await Like.findOne({
    likedBy: userId,
    comment: commentId,
  });

  if (existingComment) {
    // User has already liked the video, so we should remove the like
    await Like.findByIdAndDelete(existingComment._id);
    res.status(200).json({ message: "Like removed successfully" });
  } else {
    // User has not liked the video, so we should add a new like
    const newLike = new Like({ likedBy: userId, comment: commentId });
    await newLike.save();
    res.status(200).json({ message: "comment liked successfully" });
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const userId = req.user._id;

  const existingTweet = await Like.findOne({
    likedBy: userId,
    tweet: tweetId,
  });

  if (existingTweet) {
    // User has already liked the video, so we should remove the like
    await Like.findByIdAndDelete(existingTweet._id);
    res.status(200).json({ message: "Like removed successfully" });
  } else {
    // User has not liked the video, so we should add a new like
    const newLike = new Like({ likedBy: userId, tweet: tweetId });
    await newLike.save();
    res.status(200).json({ message: "Video liked successfully" });
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const video = await Like.find({ likedBy: req.user._id }).populate("video");
  if (!video) {
    throw new ApiError(401, "No Liked videos found");
  }

  if (video.length === 0) {
    throw new ApiError(401, "No liked videos found");
  }

  // Extract video objects from likedVideos array
  const videos = video.map((like) => like.video);

  res
    .status(200)
    .json(new ApiResponse(200, videos, "Liked videos Fetched successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

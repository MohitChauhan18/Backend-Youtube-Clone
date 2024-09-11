import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  // Done
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const likeDoc = await Like.findOne({
    $and: [
      { video: new mongoose.Types.ObjectId(videoId) },
      { likedBy: new mongoose.Types.ObjectId(req.user?._id) },
    ],
  });

  let newLikeDoc;

  if (!likeDoc) {
    newLikeDoc = await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });

    res.status(201).json(new ApiResponse(201, newLikeDoc, "Video Liked"));
  } else {
    await Like.deleteOne({
      $and: [
        { video: new mongoose.Types.ObjectId(videoId) },
        { likedBy: new mongoose.Types.ObjectId(req.user?._id) },
      ],
    });

    res.status(200).json(new ApiResponse(200, newLikeDoc, "like removed"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  // Done

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const likeDoc = await Like.findOne({
    $and: [
      { comment: new mongoose.Types.ObjectId(commentId) },
      { likedBy: new mongoose.Types.ObjectId(req.user?._id) },
    ],
  });

  let newLikeDoc;

  if (!likeDoc) {
    newLikeDoc = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });

    res.status(201).json(new ApiResponse(201, newLikeDoc, "Comment Liked"));
  } else {
    await Like.deleteOne({
      $and: [
        { comment: new mongoose.Types.ObjectId(commentId) },
        { likedBy: new mongoose.Types.ObjectId(req.user?._id) },
      ],
    });

    res
      .status(200)
      .json(new ApiResponse(200, newLikeDoc, "like removed from comment"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  // Done
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const likeDoc = await Like.findOne({
    $and: [
      { tweet: new mongoose.Types.ObjectId(tweetId) },
      { likedBy: new mongoose.Types.ObjectId(req.user?._id) },
    ],
  });

  let newLikeDoc;

  if (!likeDoc) {
    newLikeDoc = await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    res.status(201).json(new ApiResponse(201, newLikeDoc, "tweet Liked"));
  } else {
    await Like.deleteOne({
      $and: [
        { tweet: new mongoose.Types.ObjectId(tweetId) },
        { likedBy: new mongoose.Types.ObjectId(req.user?._id) },
      ],
    });

    res
      .status(200)
      .json(new ApiResponse(200, newLikeDoc, "like removed from tweet"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  // Done
  const videos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
        video: {
          $exists: true,
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
      },
    },
    {
      $addFields: {
        likedVideo: {
          $arrayElemAt: ["$likedVideo", 0],
        },
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

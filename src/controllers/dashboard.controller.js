import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }
  try {
    const totalVideo = await Video.countDocuments({ owner: channelId });
    const totalSubscribers = await subscription.countDocuments({
      owner: channelId,
    });

    const totalViews = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(channelId), // Match videos by channelId
        },
      },
      {
        $match: {
          views: { $gt: 0 }, // Filter out videos with zero views (if necessary)
        },
      },
      {
        $group: {
          _id: null, // Group all documents together
          totalViews: { $sum: "$views" }, // Sum up the views for all matched videos
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id field from the output
          totalViews: 1, // Include only totalViews in the output
        },
      },
    ]);

    const totalLikes = await Like.aggregate([
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videoDetails",
        },
      },
      {
        $unwind: "$videoDetails",
      },
      {
        $match: {
          "videoDetails.owner": new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $group: {
          _id: null,
          totalVideoLikes: {
            $sum: 1, // Count the number of likes
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalVideoLikes: 1,
        },
      },
    ]);
    const totalVideosLikes = totalLikes[0];

    // Extract totalViews from the aggregation result
    const totalVideosViews =
      totalViews.length > 0 ? totalViews[0].totalViews : 0;
    const channelStats = [
      { totalSubscribers: totalSubscribers },
      { totalVideos: totalVideo },
      { totalVideosViews: totalVideosViews },
      { totalVideosLikes: totalVideosLikes },
    ];
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { channelStats },
          "Channel stats are fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, "Error fetching channel stats " + error);
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  // Validate channelId as a valid MongoDB ObjectId
  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id: " + channelId);
  }

  // Parse page and limit to integers with default values
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  try {
    // Construct aggregation pipeline for pagination
    const pipeline = [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(channelId), // Match videos by channelId
        },
      },
      {
        $sort: { createdAt: -1 }, // Sort by createdAt descending (latest first)
      },
      {
        $skip: (page - 1) * limit, // Skip records based on pagination
      },
      {
        $limit: limit, // Limit records per page
      },
    ];

    // Execute aggregation pipeline
    const videos = await Video.aggregate(pipeline);

    // Count total number of videos (for pagination metadata)
    const totalVideos = await Video.countDocuments({ owner: channelId });

    // Construct response object with pagination metadata
    const response = {
      videos,
      page,
      limit,
      total: totalVideos,
    };

    // Send response with ApiResponse format
    res
      .status(200)
      .json(new ApiResponse(200, response, "Videos fetched successfully"));
  } catch (error) {
    // Handle errors
    throw new ApiError(400, "Error fetching channel videos: " + error.message);
  }
});

export { getChannelStats, getChannelVideos };

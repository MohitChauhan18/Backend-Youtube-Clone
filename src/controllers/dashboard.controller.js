import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const response = await Video.aggregate([
    {
      $facet: {
        subscribers: [
          {
           $set:{
            owner:req?.user?._id
           }
          },
          {
            $lookup: {
              from: "subscriptions",
              let: { ownerId: "$owner" }, // Corrected syntax for defining the let variable
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$channel", "$$ownerId"] // Using $$ to reference the variable
                    }
                  }
                }
              ],
              as: "subscribers"
            }
          },
          
        //   {
        //     $group: {
        //       _id: null,
        //       count: { $sum: 1 }, // Count the number of documents matching the condition
        //     },
        //   },
        //   {
        //     $project: {
        //       _id: 0,
        //       subscribers: "$count", // Directly assign the count value to the subscribers field
        //     },
        //   },
        ],
        totalViews: [
          {
            $match: {
              owner: req?.user?._id,
            },
          },
          {
            $group: {
              _id: null,
              views: { $sum: "$views" },
            },
          },
          {
            $project: {
              _id: 0,
              views: 1,
            },
          },
        ],
        totalLikes: [
          {
            $match: {
              owner: req?.user?._id,
            },
          },
          {
            $lookup: {
              from: "likes",
              localField: "_id", // Assuming the _id field in the video collection matches the videoId field in the likes collection
              foreignField: "video",
              as: "likes",
            },
          },
          {
            $addFields: {
              likes: { $size: "$likes" },
            },
          },
          {
            $group: {
              _id: null,
              likes: {
                $sum: "$likes",
              },
            },
          },
          {
            $project: {
              _id: 0,
              likes: 1,
            },
          },
        ],
        totalVideo:[
          {
            $match:{
              owner:req?.user?._id
            }
          }
        ]
      },
    },
    {
      $addFields: {
        totalVideo:{
          $size:"$totalVideo"
        },
        subscribers: {
          $size:{$first: "$subscribers.subscribers"},
        },
        totalViews: {
          $first: "$totalViews.views",
        },
        totalLikes:{
            $first: "$totalLikes.likes",
        },

      },
    },
    
  ]);

  res.status(200).json(new ApiResponse(200, response));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const response = await Video.aggregate([
    {
      $match: {
        owner: req?.user?._id,
      },
    },
  ]);
  res.status(200).json(new ApiResponse(200, response));
});

export { getChannelStats, getChannelVideos };

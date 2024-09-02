import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos  etc.
      const userId = req.user._id;

      const responce = await User.aggregate([
          {
              $match: {
                  _id: new mongoose.Types.ObjectId(userId),
              },
          },
          {
              $project: {
                  fullname: 1,
                  username: 1,
                  avatar: 1,
              },
          },
          {
              $lookup: {
                  from: "videos",
                  localField: "_id",
                  foreignField: "owner",
                  as: "videoInfo",
                  pipeline: [
                      {
                          $group: {
                              _id: "",
                              views: { $sum: "$views" },
                          },
                      },
                      {
                          $project: {
                              _id: 0,
                              views: "$views",
                          },
                      },
                  ],
              },
          },
          {
              $addFields: {
                  videoInfo: {
                      $first: "$videoInfo",
                  },
              },
          },
          {
              $lookup: {
                  from: "subscriptions",
                  localField: "_id",
                  foreignField: "channel",
                  as: "subsInfo",
              },
          },
          {
              $addFields: {
                  subsInfo: { $size: "$subsInfo" },
              },
          },
          // {
          //     $lookup: {
          //         from: "likes",
          //         localField: "_id",
          //         foreignField: ""
          //     }
          // }
      ]);
  
      if (!responce) {
        //   console.log("Respince 1: ", responce);
          throw new ApiError(
              500,
              "Something went wrong while fetching dashboard data !"
          );
      }
  
    //   console.log("Respince: ", responce);
      return res
          .status(200)
          .json(new ApiResponse(200, responce, "Fetched user dashboard data !"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId = req.user._id;

    const responce = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes",
                },
            },
            {
                $project: {
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    isPublished: 1,
                    createdAt: 1,
                    owner: 1,
                    description: 1,
                    likes: {$size: "$likes"},
                }
            },
            {
                $group: {
                    _id: null,
                    totalLikes: { $sum: "$likes" },
                    videos: {
                        $push: {
                          _id: "$_id",
                          videoFile: "$videoFile",
                          thumbnail: "$thumbnail",
                          title: "$title",
                          isPublished: "$isPublished",
                          createdAt: "$createdAt",
                          owner: "$owner",
                          likes: "$likes",
                          description: "$description"
                        }
                    }
                }
            },
    ]);

    if (!responce) {
        throw new ApiError(
            "Something went wrong while getting videos in dashboard !"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                responce,
                "Succesfullt fetched videos and likes."
            )
        );
})

export {
    getChannelStats, 
    getChannelVideos
    }
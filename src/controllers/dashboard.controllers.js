import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { mongoose } from "mongoose";
import { Video } from "./../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const getChannelVideos = asyncHandler(async (req, res) => {
  if (!req.user?._id) throw new ApiError(404, "Unauthorized request");
  const userId = req.user?._id;

  const video = [
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: "$avatar.url",
            },
          },
        ],
      },
    },

    {
      $unwind: "$owner",
    },

    {
      $addFields: {
        videoFile: "$videoFile.url",
      },
    },

    {
      $addFields: {
        thumbnail: "$thumbnail.url",
      },
    },
  ];

  try {
    const allVideos = await Video.aggregate(video);
    console.log("allVideos ::", allVideos);
    return res
      .status(200)
      .json(new ApiResponse(200, allVideos, "Video fetched successfully"));
  } catch (error) {
    console.error("Error while deleting video:", error);
    throw new ApiError("500", "Server Error while fetching video");
  }
});


// without aggregation pipeline for performance wise it will be slow because we are fetching data then processing data which will slower our performance, but it is easy to understand, once u get it then u can easily optimize it using aggregation

// const getChannelStats = asyncHandler(async (req, res) => {
//     // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes, total tweets etc.

//     if(!req.user?._id) throw new ApiError(404, "Unauthorized request");
//     const userId = req.user?._id;

//     const channelStats = [];

//     // total video views
//     const videos = await Video.find({ owner: userId });

//     channelStats.push({totalVideos : videos.length});
//     const totalViews = videos.reduce((acc, curr) => {
//         return acc + curr.views
//     }, 0);

//     channelStats.push({views : totalViews});

//     // total subscribers
//     const userSubscriptions = await Subscription.find({ channel: userId });
//     const totalSubscribers = userSubscriptions.length;
//     channelStats.push({subscribers : totalSubscribers});

//     // total Channel Subscribed by channel owner
//     const ChannelSubscriptions = await Subscription.find({ subscriber: userId });
//     const totalSubscribedChannel = ChannelSubscriptions.length;
//     channelStats.push({ subscribedTo: totalSubscribedChannel });

//     // console.log("channelStats ::", channelStats);

//     const totalUploadedVideos = videos.map(video => video._id);
//     // console.log("totalUploadedVideos ::", totalUploadedVideos);

//     // total likes
//     const likes = [];
//     for (let videoId of totalUploadedVideos) {
//         const likeDocument = await Like.find({ video: videoId });
//         likes.push(likeDocument[0]);

//     }

//     channelStats.push({ totalLikes: likes.length });

//     // total tweets
//     const tweets = await Tweet.find({ owner: userId });
//     channelStats.push({ totalTweets: tweets.length });
//     console.log("channelStats ::", channelStats);
//     return res.status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 channelStats,
//                 "Channel stats fetched successfully"
//         )
//     )

// })



// using aggregation pipeline to improve complex data processing will be done on database engine, which will improve performance of our application





// with aggregation pipeline for performance wise it will be fast because we are handling data processing at database engine so it will be faster our performance

const getChannelStats = asyncHandler(async (req, res) => {
  if (!req.user?._id) throw new ApiError(404, "Unauthorized request");
  const userId = req.user?._id;

  try {
    const channelStats = await Video.aggregate([
      // Match videos owned by the current user
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      // Lookup subscriptions to the channel
      {
        $lookup: {
          from: "subscriptions",
          localField: "owner",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      // Lookup subscriptions made by the channel owner
      {
        $lookup: {
          from: "subscriptions",
          localField: "owner",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      // Lookup likes for the user's videos
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likedVideos",
        },
      },
      // Lookup comments for the user's videos
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "videoComments",
        },
      },
      // Lookup tweets by the user
      {
        $lookup: {
          from: "tweets",
          localField: "owner",
          foreignField: "owner",
          as: "tweets",
        },
      },
      // Group to calculate stats
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalViews: { $sum: "$views" },
          subscribers: { $first: "$subscribers" },
          subscribedTo: { $first: "$subscribedTo" },
          totalLikes: { $sum: { $size: "$likedVideos" } },
          totalComments: { $sum: { $size: "$videoComments" } },
          totalTweets: { $first: { $size: "$tweets" } },
        },
      },
      // Project the desired fields
      {
        $project: {
          _id: 0,
          totalVideos: 1,
          totalViews: 1,
          subscribers: { $size: "$subscribers" },
          subscribedTo: { $size: "$subscribedTo" },
          totalLikes: 1,
          totalComments: 1,
          totalTweets: 1,
        },
      },
    ]);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channelStats[0],
          "Channel stats fetched successfully"
        )
      );
  } catch (err) {
    console.error("Error in getChannelStats:", err);
    res.status(500).json(new ApiResponse(500, null, err.message));
  }
});

export { getChannelVideos, getChannelStats };

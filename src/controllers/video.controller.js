import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { exec } from "child_process";
import { path } from "@ffmpeg-installer/ffmpeg";
import { path as ffprobePath } from "@ffprobe-installer/ffprobe";
import ffmpeg from "fluent-ffmpeg";
import { View } from "../models/view.modal.js";

// Specify the path to ffmpeg and ffprobe binaries
ffmpeg.setFfmpegPath(path);
ffmpeg.setFfprobePath(ffprobePath);
function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration;
        resolve(duration);
      }
    });
  });
}

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "asc",
  } = req.query;
  const { _id } = req?.user;
  const allVideo = await Video.aggregate([
    {
      $match: {
        // owner:_id,
        title: { $regex: query, $options: "i" },
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
              username: 1,
              email: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "desc" ? -1 : 1,
      },
    },

    {
      $skip: (Number(page) - 1) * limit,
    },
    {
      $limit: Number(limit),
    },
  ]);
  return res.status(200).json(new ApiResponse(200, allVideo));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFile = req.files?.videoFile?.[0]?.filename;
  const thumbnail = req.files?.thumbnail?.[0]?.filename;
  let duration;
  if (videoFile) {
    duration = await getVideoDuration(req?.files?.videoFile?.[0]?.path);
  }
  console.log(title, description, videoFile, thumbnail);
  if (!title || !videoFile || !thumbnail || !description) {
    throw new ApiError(400, "All field are required");
  }
  const respose = await Video.create({
    title,
    description,
    videoFile,
    thumbnail,
    duration,
    owner: req?.user?._id,
  });

  const videoResponse = await Video.findById(respose._id).select(
    "-owner -_id -createdAt -updatedAt"
  );

  res.status(200).json(new ApiResponse(200, videoResponse));
});
let a;
let count=0;
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (a) {
    clearTimeout(a)
  }
  a=setTimeout(()=>{
    // View.create({
    //   viewBy:req?.user?._id,
    //   videoId:videoId
    // })
    Video?.findById(new mongoose.Types.ObjectId(videoId)).then((element)=>{
      //  element.view=element.view+1
       console.log(element.views,">?>?>?>?>?>?")
       element.views=element.views+1
       element.save()
    })
  },5000)
  let agg = [
    {
      $match: {
        $and: [
          { _id: new mongoose.Types.ObjectId(videoId) },
          // {owner:req?.user?._id},
        ],
      },
    },
  ];
  //   if (req?.user?._id) {
  //     agg.push({
  //       $addFields: {
  //         isOwner: {
  //           $cond: {
  //             if: { $eq: ["$owner", req?.user?._id] }, // Check if owner equals req.user._id
  //             then: true, // If true, set the new field to true
  //             else: false, // If false, set the new field to false
  //           },
  //         },
  //       },
  //     });
  //   }
  const response = await Video.aggregate([
    ...agg,
    {
      $lookup: {
        from: "subscriptions", // Replace with your subscriber collection name
        localField: "owner", // Assuming your video document has an "owner" field
        foreignField: "channel", // Assuming your subscriber document has an "_id" field referencing the owner
        as: "subscriberCount",
      },
    },
    // {
    //   $lookup:{
    //     localField:"_id",
    //     foreignField:"videoId",
    //     from:"views",
    //     as:"views"
    //   }
    // },
    {
      $addFields:{
        isSubscribed:{
          $in:[req?.user?._id,{$map:{
            input:"$subscriberCount",
            as:"a",
            in:"$$a.subscriber"
          }}]
        }
      }
    },
    {
      $addFields: {
        subscriberCount: { $size: "$subscriberCount" },
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
    
    // {
    //   $addFields: {
    //     isLiked: {
    //       $cond: {
    //         if: {
    //           $gt: [
    //             {
    //               $size: {
    //                 $filter: {
    //                   input: "$likes",
    //                   as: "like",
    //                   cond: { $eq: ["$$like.likedBy", req?.user?._id] },
    //                 },
    //               },
    //             },
    //             0,
    //           ],
    //         }, // Check if any element matches user ID
    //         then: true,
    //         else: false,
    //       },
    //     },
    //   },
    // },
{
  $addFields:{
    isLiked:{
      $in:[req?.user?._id,{$map:{input:"$likes",as:"item",in:"$$item.likedBy"}}]
    }
  }
},
    {
      $addFields: {
        likes: { $size: "$likes" },
      },
    },

    {
      $lookup: {
        localField: "owner",
        foreignField: "_id",
        from: "users",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              email: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);
  if (!response?.length) {
    throw new ApiError(400, "Video Not Found");
  }
  res.status(200).json(new ApiResponse(200, {...response[0]}));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnail = req?.file?.filename;

  if (!title && !description && !req.file) {
    throw new ApiError(400, "Atleast update something😜");
  }
  const isCheck = await Video.aggregate([
    {
      $match: {
        $and: [
          { _id: new mongoose.Types.ObjectId(videoId), owner: req?.user?._id },
        ],
      },
    },
  ]);
  if (!isCheck?.length) {
    throw new ApiError(
      400,
      "You can not update this video details as you are not a owner of this video"
    );
  }
  let payload = {};
  if (title) {
    payload.title = title;
  }
  if (description) {
    payload.description = description;
  }
  if (thumbnail) {
    payload.thumbnail = thumbnail;
  }

  const response = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: payload,
    },
    { new: true }
  );
  //TODO: update video details like title, description, thumbnail
  res.status(200).json(new ApiResponse(200, response));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const response = await Video.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(videoId),
    owner: req.user._id,
  });
  if (!response) {
    throw new ApiError(
      400,
      "Video not found or you don't have permission to update"
    );
  }
  res.status(200).json(new ApiResponse(200, "Video Delete SuccessFully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findOne({
    _id: videoId,
    owner: req.user._id,
  });
  if (!video) {
    throw new ApiError(
      400,
      "Video not found or you don't have permission to update"
    );
  }
  video.isPublished = !video.isPublished;

  await video.save();

  res
    .status(200)
    .json(new ApiResponse(200, "isPublished status updated successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};

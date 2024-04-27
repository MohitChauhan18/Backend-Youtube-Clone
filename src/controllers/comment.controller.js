import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyId } from "../utils/verifyId.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 2 } = req.query;
  const verifiedVideo = verifyId(videoId);
  const isVideoExist = await Video.findById(verifiedVideo);
  if (!isVideoExist) {
    throw new ApiError(200, "Video Not Found");
  }
  const response = await Comment.aggregate([
    {
      $match: {
        video: verifiedVideo,
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
              _id: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
        $addFields:{
            owner:{$first:"$owner"}
        }
    },
    {
      $sort: { createdAt: -1 } // Sort by createdAt field in descending order (latest first)
    },
    {
      $facet: {
        comments: [
          {
            $skip: ((page - 1) * limit)
          },
          {
            $limit: Number(limit)
          }
        ],
        totalCount: [
          {
            $count: "total"
          }
        ]
      }
    },
    {
      $addFields:{
        totalCount:{
          $first:"$totalCount.total"
        }
      }
    }
  ]);
  res.status(200).json(new ApiResponse(200, response[0]));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content } = req.body;
  const { videoId } = req?.params;
  const verifiedVideo = verifyId(videoId);
  if (!content) {
    throw new ApiError(400, "Content Is Required Field.");
  }
  const isVideoExist = await Video.findById(verifiedVideo);
  if (!isVideoExist) {
    throw new ApiError(400, "Video Not Found");
  }
  const response = await Comment.create({
    content,
    video: verifiedVideo,
    owner: req?.user?._id,
  });

  if (!response) {
    throw new ApiError(400, "Something went wrong");
  }
  res
    .status(200)
    .json(new ApiResponse(200, "Your comment has been added successfully!"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const {content}=req.body
  const {commentId}=req?.params
  const verifiedCommentId=verifyId(commentId)
  const response=await Comment.findOneAndUpdate({
    $and:[
        {
          _id:verifiedCommentId   
        },
        {
            owner:req?.user?._id
        }
    ]
  },{
    $set:{
        content
    }
  },{
    new:true
  })
  if (!response) {
    throw new ApiError(400,"Oops! We couldn't find the Comment you're trying to update. It might not exist or it's possible that you didn't create this Comment")
  }
  res.status(200).json(new ApiResponse(200,response))
});

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId}=req?.params
    const verifiedCommentId=verifyId(commentId)
    const response=await Comment.findOneAndDelete({
        $and:[
            {_id:verifiedCommentId},
            {owner:req?.user?._id}
        ]
    })
      if (!response) {
        throw new ApiError(400,"Oops! We couldn't find the Comment you're trying to update. It might not exist or it's possible that you didn't create this Comment")
      }
      res.status(200).json(new ApiResponse(200,"The comment has been deleted successfully."))
});

export { getVideoComments, addComment, updateComment, deleteComment };

import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 2 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $skip: (+page - 1) * limit,
    },
    {
      $limit: +limit,
    },
  ]);

  const totalCount = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $count: "totalCount",
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: comments, totalCount: totalCount[0].totalCount },
        "comments fetched successfully"
      )
    );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  // Done
  const { videoId } = req.params;

  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  res
    .status(200)
    .json(new ApiResponse(201, comment, "comment successfully created"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  // Done
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment Id");
  }

  if (!content) {
    throw new ApiError(400, "content is required");
  }

  const comment = await Comment.findOne({
    $and: [
      { _id: commentId },
      { owner: new mongoose.Types.ObjectId(req.user?._id) },
    ],
  });

  if (!comment) {
    throw new ApiError(500, "invalid comment");
  }

  comment.content = content;
  const newCommnet = await comment.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, newCommnet, "comment updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment Id");
  }

  const resp = await Comment.findById(commentId);

  console.log(resp.owner, "resp");
  console.log(req.user?._id, "req.user?._id");

  if (!req.user?._id.equals(resp.owner)) {
    throw new ApiError(400, "Unauthorised request");
  }

  await Comment.findByIdAndDelete(commentId);

  res.status(200).json(new ApiResponse(200, {}, "Comment deleted"));

  //   const comment = await Comment.findOne({
  //     $and: [
  //       { _id: commentId },
  //       { owner: new mongoose.Types.ObjectId(req.user?._id) },
  //     ],
  //   });

  //   if (!comment) {
  //     throw new ApiError(500, "unauthorised request");
  //   }
});

export { getVideoComments, addComment, updateComment, deleteComment };

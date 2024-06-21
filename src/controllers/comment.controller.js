import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {

//TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Check if videoId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return new ApiError(400, "Invalid video ID");
  }
  // Calculate the number of comments to skip for pagination

  const skip = (page - 1) * limit;
  const comments = await Comment.find({ video: videoId })
    .skip(skip)
    .limit(parseInt(limit))
    .exec();

  // If no comments found
  if (comments.length === 0) {
    return new ApiError(404, "No comments found for video with id " + videoId);
  }

  res
    .status(200)
    .json(new ApiResponse(200, comments, "All Comment Fetched Successfully"));
    
})

const addComment = asyncHandler(async (req, res) => {
 // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return new ApiError(400, "Invalid video ID");
  }

  if (!content) {
    return new ApiError(400, "Content is required");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
  });
  console.log(comment);

  if (!comment) {
    throw new ApiError(401, "Error creating comment");
  }

  res.status(200).json(new ApiResponse(200, comment, "Comment created"));

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
  const { content } = req.body;
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return new ApiError(400, "Invalid video ID");
  }

  if (!content) {
    return new ApiError(400, "Content is required");
  }

  const comment = await Comment.findByIdAndUpdate(commentId, {
    content,
  });
  console.log(comment);

  if (!comment) {
    throw new ApiError(401, "Error updating comment");
  }

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Updated Successfully"));

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
 const { commentId } = req.params;

  // Check if commentId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  // Attempt to find and delete the comment by its ID
  const comment = await Comment.findByIdAndDelete(commentId);

  // If no comment is found, throw a 404 error
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // Send success response
  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"));


})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }

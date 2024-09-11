import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // TODO: get video, upload to cloudinary, create video
  // Done

  if (!title && !description) {
    throw new ApiError(400, "All fields required");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is rquired");
  }

  const thumbnailFileLocalPath = req.files?.thumbnail[0]?.path;
  if (!thumbnailFileLocalPath) {
    throw new ApiError(400, "Thumbnail file is rquired");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);

  const createdVideo = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoFile.duration,
    title,
    description,
    owner: req.user?._id,
  });

  res
    .status(201)
    .json(new ApiResponse(200, createdVideo, "Video published succuessfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  //TODO: get video by id
  // Done
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "video id is required");
  }

  const video = await Video.findById(videoId);

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  // Done

  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "video id is required");
  }

  const { title, description } = req.body;

  if (!title && !description) {
    throw new ApiError(400, "All fields required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const thumbnailFileLocalPath = req.file.path;
  if (!thumbnailFileLocalPath) {
    throw new ApiError(400, "Thumbnail file is rquired");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);

  await Video.findByIdAndUpdate(videoId, {
    $set: {
      title,
      description,
      thumbnail: thumbnail.url,
    },
  });

  const updatedVideo = await Video.findById(videoId);

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video Info Updated Successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  // Done
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "video id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  await Video.findByIdAndDelete(videoId);

  res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  // Done

  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "video id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  await Video.findByIdAndUpdate(videoId, {
    $set: {
      isPublished: !video.isPublished,
    },
  });

  const updatedVideo = await Video.findById(videoId);

  res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video status changed"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};

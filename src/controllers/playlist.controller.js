import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist

  if (!req.user?._id) {
    throw new ApiError(400, "Please login");
  }

  const { name, description, videos } = req.body;

  if (!name) {
    throw new ApiError(400, "name is required");
  }

  const samePlaylist = await Playlist.findOne({
    $and: [{ name }, { owner: new mongoose.Types.ObjectId(req.user?._id) }],
  });

  if (samePlaylist) {
    throw new ApiError(400, "There is already a playlist with the same name");
  }

  const playlist = await Playlist.create({
    name,
    description,
    videos: videos || [],
    owner: req.user?._id,
  });

  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "userId is required");
  }

  const playlistData = await Playlist.find({
    owner: userId,
  });

  res
    .status(200)
    .json(new ApiResponse(200, playlistData, "playlist fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  // Done
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist id is required");
  }

  const playlist = await Playlist.find({
    $and: [
      { _id: playlistId },
      {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    ],
  });

  if (!playlist) {
    throw new ApiError(400, "unauthorized request");
  }

  const detailedPlaylist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(200, detailedPlaylist, "playlist fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  // Done
  const { playlistId, videoId } = req.params;

  if (!req.user?._id) {
    throw new ApiError(400, "Please login");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist id is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const playlist = await Playlist.findOne({
    $and: [
      { _id: playlistId },
      { owner: new mongoose.Types.ObjectId(req.user?._id) },
    ],
  });

  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is already there");
  }

  playlist.videos.push(videoId);

  const newPlaylist = await playlist.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "Video added in the playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  // Done
  const { playlistId, videoId } = req.params;

  if (!req.user?._id) {
    throw new ApiError(400, "Please login");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist id is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const playlist = await Playlist.findOne({
    $and: [
      { _id: playlistId },
      { owner: new mongoose.Types.ObjectId(req.user?._id) },
    ],
  });

  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }

  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is not included");
  }

  playlist.videos.pull(videoId);

  const newPlaylist = await playlist.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "Video removed from the playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // Done
  const { playlistId } = req.params;

  if (!req.user?._id) {
    throw new ApiError(400, "Please login");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist id is required");
  }

  const playlist = await Playlist.findOne({
    $and: [
      { _id: playlistId },
      { owner: new mongoose.Types.ObjectId(req.user?._id) },
    ],
  });

  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }

  await Playlist.findByIdAndDelete(playlist._id);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  // Done
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!req.user?._id) {
    throw new ApiError(400, "Please login");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist");
  }

  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }
  if (!description) {
    throw new ApiError(400, "Playlist description is required");
  }

  const playlist = await Playlist.findOne({
    $and: [
      { _id: playlistId },
      { owner: new mongoose.Types.ObjectId(req.user?._id) },
    ],
  });

  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }

  playlist.name = name;
  playlist.description = description;

  const newPlaylist = await playlist.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

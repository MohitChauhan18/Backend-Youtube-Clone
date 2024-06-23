import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description, videos } = req.body;
  const owner = req.user._id;
  // Validate request data
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    // Create a new playlist
    const newPlaylist = new Playlist({
      name,
      description,
      videos,
      owner,
    });

    // Save the playlist to the database
    await newPlaylist.save();

    // Send success response
    res.status(201).json({
      message: "Playlist created successfully",
      playlist: newPlaylist,
    });
  } catch (error) {
    // Handle errors
    console.error("Error creating playlist:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    //TODO: get user playlists
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(401, "No Playlist Found for the user");
    }

    const playlists = await Playlist.find({ owner: userId });

    if (!playlists) {
      throw new ApiError(401, "No Playlist Found for the user");
    }

    res
      .status(200)
      .json(new ApiResponse(200, playlists, "Playlist fetched successfully"));
  } catch (error) {
    throw new ApiError(401, "Error while fetching playlist " + error);
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  try {
    //TODO: get user playlists
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(401, "No Playlist Found with this playlistId");
    }

    const playlists = await Playlist.find({ _id: playlistId });

    if (!playlists) {
      throw new ApiError(401, "No Playlist Found for the user");
    }

    res
      .status(200)
      .json(new ApiResponse(200, playlists, "Playlist fetched successfully"));
  } catch (error) {
    throw new ApiError(401, "Error while fetching playlist " + error);
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  try {
    //TODO: get user playlists
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(
        401,
        "No Playlist Found with playlistId: " + playlistId
      );
    }

    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId },
      { $addToSet: { videos: videoId } },
      { new: true }
    );
    if (!playlist) {
      throw new ApiError(401, "Error occurred while loading playlist");
    }

    res
      .status(200)
      .json(new ApiResponse(200, playlist, "Video Added to Playlist"));
  } catch (error) {
    throw new ApiError(401, "Error occurred while loading playlist" + error);
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  try {
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(
        401,
        "No Playlist Found with playlistId: " + playlistId
      );
    }

    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId },
      { $pull: { videos: videoId } },
      { new: true }
    );
    if (!playlist) {
      throw new ApiError(401, "Error occurred while loading playlist");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          playlist,
          "Video Removed from playlist Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Error occurred while loading playlist" + error);
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  try {
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(
        401,
        "No Playlist Found with playlistId: " + playlistId
      );
    }

    const playlist = await Playlist.findOneAndDelete({ _id: playlistId });
    if (!playlist) {
      throw new ApiError(401, "Error occurred while loading playlist");
    }

    res
      .status(200)
      .json(new ApiResponse(200, playlist, "playlist Deleted Successfully"));
  } catch (error) {
    throw new ApiError(401, "Error occurred while deleting playlist" + error);
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!name && !description) {
    return res
      .status(400)
      .json({ message: "Name and Description is required" });
  }

  try {
    const updatePlaylist = await Playlist.findByIdAndUpdate(
      { _id: playlistId },
      {
        name,
        description,
      },
      { new: true }
    );

    // Send success response
    res.status(201).json(
      new ApiResponse(
        201,
        updatePlaylist,

        "Playlist update successfully"
      )
    );
  } catch (error) {
    // Handle errors
    throw new ApiError(400, "Error updating playlist");
  }
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

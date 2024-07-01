import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist

    try {
        const createPlaylist = await Playlist.create({
            name: name,
            description: description,
            owner: req.user._id
        })
        if (createPlaylist) {
            return res
                .status(201)
                .json(
                    new ApiResponse(201, createPlaylist, "Playlist created successfully")
                )
        }

        return res
            .status(500)
            .json(new ApiResponse(500, null, "Something went wrong at creating playlist"))
    } catch (error) {
        console.log("error at createPlaylist", error);
    }

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    try {
        const getUserPlaylists = await Playlist.find({ owner: userId })
        if (getUserPlaylists) {
            return res
                .status(200)
                .json(new ApiResponse(200, getUserPlaylists, "Playlists fetched successfully"))
        }
        return res
            .status(404)
            .json(new ApiResponse(404, null, "Playlists not found"))
    } catch (error) {
        console.log("error at getUserPlaylists", error);
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    try {
        const getPlaylist_ById = await Playlist.findById(playlistId)
        if (getPlaylist_ById) {
            return res
                .status(200)
                .json(new ApiResponse(200, getPlaylist_ById, "Playlist fetched successfully"))
        }
        return res
            .status(404)
            .json(new ApiResponse(404, null, "Playlist not found"))
    } catch (error) {
        console.log("error at getPlaylistById", error);
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    try {
        const getVideo = await Playlist.findOne({ _id: playlistId, videos: videoId })

        if (getVideo) {
            return res
                .status(400)
                .json(new ApiResponse(400, null, "Video already added to playlist"))
        }

        const addVideoToPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
            $push: {
                videos: videoId
            }
        })
        if (addVideoToPlaylist) {
            return res
                .status(200)
                .json(new ApiResponse(200, addVideoToPlaylist, "Video added to playlist successfully"))
        }

        return res
            .status(500)
            .json(new ApiResponse(500, null, "Something went wrong at adding video to playlist"))
    } catch (error) {
        console.log("error at addVideoToPlaylist", error);
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    try {
        const getVideo = await Playlist.findOne({ _id: playlistId, videos: videoId })
        if (!getVideo) {
            return res
                .status(404)
                .json(new ApiResponse(404, null, "Video not found in playlist"))
        }

        const removeVideoFromPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
            $pull: {
                videos: videoId
            }
        })
        if (removeVideoFromPlaylist) {
            return res
                .status(200)
                .json(new ApiResponse(200, removeVideoFromPlaylist, "Video removed from playlist successfully"))
        }
        return res
            .status(500)
            .json(new ApiResponse(500, null, "Something went wrong at removing video from playlist"))
    } catch (error) {
        console.log("error at removeVideoFromPlaylist", error);
    }

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    try {
        const getplaylists = await Playlist.findById(playlistId)
        if (!getplaylists) {
            return res
                .status(404)
                .json(new ApiResponse(404, null, "Playlist not found"))
        }
        const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)
        if (deletePlaylist) {
            return res
                .status(200)
                .json(new ApiResponse(200, null, "Playlist deleted successfully"))
        }
        return res
            .status(500)
            .json(new ApiResponse(500, null, "Something went wrong at deleting playlist"))
    } catch (error) {
        console.log("error at deletePlaylist", error);
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    try {
        const updatePlaylist = await Playlist.findByIdAndUpdate(playlistId, {
            name: name,
            description: description
        }, { new: true })
        if (updatePlaylist) {
            return res
                .status(200)
                .json(new ApiResponse(200, updatePlaylist, "Playlist updated successfully"))
        }
        if (!updatePlaylist) {
            return res
                .status(404)
                .json(new ApiResponse(404, null, "Playlist not found"))
        }
        return res
            .status(500)
            .json(new ApiResponse(500, null, "Something went wrong at updating playlist"))
    } catch (error) {

    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}

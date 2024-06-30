import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    
    if ( !name || name.trim() === "" ) throw new ApiError(400, "Playlist name is the required name")

    if ( !description || description.trim() === "" ) throw new ApiError(400, "Playlist discription is a required argument")

    const playlistCreation = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if (!playlistCreation) throw new ApiError(400, "Something went wrong while playlist creation")

    res.status(201)
    .json(new ApiResponse(201, playlistCreation, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    if( !userId || userId.trim() === "" ) throw new ApiError(400, "userId is a required argument")

    if(!isValidObjectId(userId)) throw new ApiError(400, "Invalid userId")

    const fetchPlaylist = await Playlist.findOne({
        owner: userId
    })

    if(!fetchPlaylist) throw new ApiError(400, "No data found")

    res.status(200)
    .json(new ApiResponse(200, fetchPlaylist, "Playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if( !playlistId || playlistId.trim() === "" ) throw new ApiError(400, "playlistId is a required argument")

    if(!isValidObjectId(playlistId)) throw new ApiError(400, "playlistId userId")

    const fetchPlaylist = await Playlist.findById(playlistId)

    if(!fetchPlaylist) throw new ApiError(400, "No data found")

    res.status(200)
    .json(new ApiResponse(200, fetchPlaylist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
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

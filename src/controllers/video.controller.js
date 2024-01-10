import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import { decode } from "jsonwebtoken"

const findCloudinaryPublicId =  (url)=>{
    const videoLinkSplit = url.split("/")
    const video_public_id = videoLinkSplit[videoLinkSplit.length-1].split(".")[0]
    return video_public_id
}


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if(!(title && description)){
        throw new ApiError(400,"title and description must be provided");
    }

    //* collect local path of files
    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if(!(videoLocalPath || thumbnailLocalPath)){
        throw new ApiError(400,"File not found");
    } 
    //* upload on cloudinary
    const videoUploadOnCloudinaryResponse =  await uploadOnCloudinary(videoLocalPath);
    const thumbnailUploadOnCloudinaryResponse = await uploadOnCloudinary(thumbnailLocalPath)
    if(!(videoUploadOnCloudinaryResponse || thumbnailUploadOnCloudinaryResponse)){
        throw new ApiError(400,"something went wrong while uploading");
    }
    
    console.table(videoUploadOnCloudinaryResponse);

    const video = await Video.create({
        videoFile : videoUploadOnCloudinaryResponse?.url || "",
        thumbnail : thumbnailUploadOnCloudinaryResponse?.url || "",
        owner : req.user,
        duration: videoUploadOnCloudinaryResponse?.duration || 0,
        title,
        description,

    })
    if(!video){
        throw new ApiError(500, "Something went wrong while uploading")
    }

    res
    .status(200)
    .json( new ApiResponse(200, video , "video uploaded successfully"))

    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!videoId){
        throw new ApiError(400,"id not found");
    }
    const video = await Video.findById(videoId).populate("owner");

    if(!video) {
        throw new ApiError(500,"something went wrong while getting video");
    }

    res
    .status(200)
    .json( new ApiResponse(200, video, "video finded successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"id not found");
    }

    const video = await Video.findByIdAndDelete(videoId)
    if(!video){
        throw new ApiError(400,"something wrong happened while fetching video");
    }

    //* check you are the owner of this video or not
    if(!req.user._id.equals(video.owner._id)){
        throw new ApiError(400,"you are not the owner of this video");
    }
    const videoFile = findCloudinaryPublicId(video.videoFile);
    const thumbnail = findCloudinaryPublicId(video.thumbnail);
    
    const deleteVideo = await deleteOnCloudinary(videoFile, 'video');
    const deleteThumbnail = await deleteOnCloudinary(thumbnail, 'image');

    res
    .status(200)
    .json(new ApiResponse(200, {deleteVideo, deleteThumbnail} ,"video delete successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

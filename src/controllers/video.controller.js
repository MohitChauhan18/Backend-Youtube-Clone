import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, getPublicId, deleteFromCloudinary } from "../utils/cloudinary.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "Test", sortBy = "createdAt" , sortType = -1 , userId } = req.query

    if(!userId) throw new ApiError(400, "UserId is a required argument")

    if (userId != req.user._id) throw new ApiError(400, "Invalid user Id")

    const allVideoDetail = await Video.aggregate([
        {
            $match: {
                $or: [
                    {title: { $regex: query, $options: "i"}},
                    {description: { $regex: query, $options: "i"}}
                ]
            }
        },
        {
            $sort:{
                sortBy: sortType
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ]
    )

    // We can also use moonose mongoose-aggregate-paginate-v2

    res.status(200)
    .json(new ApiResponse(200, allVideoDetail, "videos detail fetched successfully"))


})

const publishAVideo = asyncHandler(async (req, res) => {
    // check if title and description is present, if not throw an error
    // check local file path for video are present, if not throw an error
    // upload the video and thumbnail on cloudnary, and extract the url
    // if any error why uploading throw an error
    // Save the video url, titile, discription, length in db and send response

    const { title, description} = req.body

    if (!title || !description) throw new ApiError(400, "All fields are required")

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    
    if (! videoLocalPath) throw new ApiError(400, "video file is a required argument ")
    if (! thumbnailLocalPath) throw new ApiError(400, "thumbnail image is a required argument")

    const videoUploadResponse = await uploadOnCloudinary(videoLocalPath)

    if(!videoUploadResponse?.url) throw new ApiError(400, "Error while uploading video")

    const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnailUploadResponse?.url) throw new ApiError(400, "Error while uploading thumbnail")

    const video = await Video.create({
        videoFile: videoUploadResponse.url,
        thumbnail: thumbnailUploadResponse.url,
        title: title.trim(),
        description: description.trim(),
        duration: videoUploadResponse?.duration,
        owner: req.user?._id,
        isPublished: true
    })

    if(!video) throw new ApiError(400, "Somwthing went wrong while publishing")

    res.status(200)
    .json( new ApiResponse(200, video, "upload successful"))

})

const getVideoById = asyncHandler(async (req, res) => {
    // check if video id is present in params, if not throw an error
    // find the document from db using the id, if no document is present throw an error
    // If document is present send its detail in response 

    const { videoId } = req.params

    if(!isValidObjectId(videoId) ) throw new ApiError(400, "Invalid video id value")

    const videoDetail = await Video.findById(videoId)

    if(!videoDetail) throw new ApiError(400, "No video with given video id")

    if(videoDetail.owner.toString() != req.user._id.toString()) throw new ApiError(400, "you don't have permission to delete the video")
    
    res.status(200)
    .json(new ApiResponse(200, videoDetail, "Video detail fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    // Check if videoId is valid, if not throw an error
    // Check for the fields to be updated
    // if thumbanil is present, delete the previous one after updating it from new one 
    // send the response after updating
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id")

    const { title, description } = req.body

    const video = await Video.findById(videoId)

    if(!video) throw new ApiError(400, "No video with given video id")

    if(video.owner != req.user._id) throw new ApiError(400, "you don't have permission to delete the video")


    const videoDetail = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
              ...(title && { title: title.trim()}),
              ...(description && { description: description.trim()})
            }
        },
        {
            new: true
        }
    )

    if(!videoDetail) throw new ApiError(400, "No video with given video id")
   
    const thumbnailLocalPath = req.file?.path

    if(thumbnailLocalPath){
        const oldThumbnailUrl = videoDetail?.thumbnail

        const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath)

        if(!thumbnailUploadResponse?.url) throw new ApiError("Something went wrong while uploading")

        videoDetail.thumbnail = thumbnailUploadResponse.url
        const updatedVideoDetail = await videoDetail.save({validateBeforeSave: false})
        if(!updatedVideoDetail) throw new ApiError(400, "Error while updating thumbnail")

        if(oldThumbnailUrl){
            const public_id = await getPublicId(oldThumbnailUrl)
            if(public_id){
                await deleteFromCloudinary(public_id, "video")
            }
        }

        res.status(200)
        .json(new ApiResponse(200, updatedVideoDetail, "Video detail updated successfully "))

    }
    else{

        res.status(200)
        .json(new ApiResponse(200, videoDetail, "Video detail updated successfully "))

    }


})

const deleteVideo = asyncHandler(async (req, res) => {
    // check for valid video id, if not throw an error
    // Check for video detail from db, then delete it
    // Delete the video and thumbnail from cloudinary
    // send the response

    const { videoId } = req.params

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id")


    const videoDetail = await Video.findById(videoId)

    if(!videoDetail) throw new ApiError(400, "No video with given video id")

    if(videoDetail.owner.toString() != req.user._id.toString()) throw new ApiError(400, "you don't have permission to delete the video")

    const deleteStatus = await Video.findByIdAndDelete(videoId)

    if(!deleteStatus) throw new ApiError(400, "something went wrong while deleting")

    const videoUrl = deleteStatus?.videoFile
    const thubnailUrl = deleteStatus?.thumbnail

    if(videoUrl){
        const public_id = await getPublicId(videoUrl)
        if(public_id){
            await deleteFromCloudinary(public_id, "video")
        }
    }

    if(thubnailUrl){
        const public_id = await getPublicId(thubnailUrl)
        if(public_id){
            await deleteFromCloudinary(public_id, "image")
        }
    }

    res.status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"))


})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id")


    const videoDetail = await Video.findById(videoId)

    if(!videoDetail) throw new ApiError(400, "No video with given video id")

    if(videoDetail.owner != req.user._id) throw new ApiError(400, "you don't have permission to toggle the video status")

    videoDetail.isPublished = !videoDetail.isPublished

    videoDetail.save({validateBeforeSave: false})

    return res.status(200)
    .json(new ApiResponse(200, {}, "Publish status toggel successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

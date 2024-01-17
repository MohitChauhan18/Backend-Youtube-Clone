import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const isUserOwner = async(videoId,req)=>{
    const video = await Video.findById(videoId);

    if(video?.owner !== req.user?._id){
        return false;
    }
    return true;
    
}

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
        throw new ApiError("Title and description both are required !")
    }
    //retreive the video and thumbnail

    const videolocalpath = req.files?.videoFile[0]?.path;
    const thumbnaillocalpath = req.files?.thumbnail[0]?.path;

    if(videolocalpath){
        throw new ApiError(404,"Video is required!!!")
    }
    if(thumbnaillocalpath){
        throw new ApiError(404,"Thumbnail is required!!!")
    }
    //cloud 
    const video = await uploadOnCloudinary(videolocalpath);
    const thumbnail = await uploadOnCloudinary(thumbnaillocalpath);

    if(!video?.url){
        throw new ApiError(500,"Something wrong happens while uplaoding the video")
    }
    if(!thumbnail?.url){
        throw new ApiError(500,"Something wrong happens while uplaoding the thumbnail")
    }
    
    const newVideo = await Video.create({
        videoFile:video?.url,
        thumbnail:thumbnail?.url,
        title,
        description,
        duration:video?.duration,
        isPublished:true,
        owner:req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200,newVideo,"Video Published Successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(404,"videoId is Required")
    }
    const video = await Video.findById(videoId)
    
    if( !video || ( !video?.isPublished &&  !(video?.owner === req.user?._id) ) ){
        throw new ApiError(404,"Video not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video fetched Successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(404,"videoId is required !!!")
    }
    if(!isUserOwner(videoId,req)){
        throw new ApiError(300,"Unauthorized Access")
    }

    //TODO: update video details like title, description, thumbnail
    //retreiving 
    const {title,description} = req.body;
    if(!title || !description){
        throw new ApiError(404,"Title or Description is required!!!")
    }
    const thumbnaillocalpath = req.file?.path;
   
    const thumbnail = await uploadOnCloudinary(thumbnaillocalpath);
    if(!thumbnail){
     throw new ApiError(400,"Something went wrong while updating the thumbnail")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                title:title,
                description:description,
                thumbnail:thumbnail
            }
        },{
            new:true
        })
    
    if(!updatedVideo){
     throw new ApiError(500,"Something went wrong while updating the details")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedVideo,"Video Updated Successfully"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId){
        throw new ApiError(404,"videoId is required !!!")
    }
    if(!isUserOwner(videoId,req)){
        throw new ApiError(300,"Unauthorized Access")
    }

    const videoDeleted = await Video.findByIdAndDelete(videoId);
    
    if(videoDeleted){
        throw new ApiError(400,"Something error happened while deleting the video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video Deleted Successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(404,"videoId is required !!!")
    }

    if(!isUserOwner(videoId,req)){
        throw new ApiError(300,"Unauthorized Access")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                isPublished :{
                    $not:"$isPublished"
                }

            }
        },
        {new:true})
    if(!updatedVideo){
        throw new ApiError(500,"Something went wrong while toggling the status")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedVideo," PublishStatus of the video  is toggled successfully"))

    

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

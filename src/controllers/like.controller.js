import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { verifyId } from "../utils/verifyId.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const verifieldVideoId=verifyId(videoId)
    const isVideoExist=await Video.findById(verifieldVideoId)
    if (!isVideoExist) {
        throw new ApiError(400,"Video Not Found")
    }
    let message;
    const response=await Like.findOneAndDelete({
        $and:[
            {
                video:verifieldVideoId,
                likedBy:req?.user?._id
            }
        ]
    })
    if (response) {
        message="Your like has been removed from this video."
    }else{
       await Like.create({
        video:verifieldVideoId,
        likedBy:req?.user?._id
       })
       message="You've successfully liked this video!"
    }
    res.status(200).json(new ApiResponse(200,message))
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment
    const {commentId} = req.params
    const verifieldCommentId=verifyId(commentId)
    const isCommentExist=await Comment.findById(verifieldCommentId)
    if (!isCommentExist) {
        throw new ApiError(400,"Comment Not Found")
    }
    let message;
    const response=await Like.findOneAndDelete({
        $and:[
            {comment:verifieldCommentId},
            {likedBy:req?.user?._id}
        ]
    })
    if (response) {
        message="Your like has been removed from this Comment."
    }else{
        await Like.create({
            comment:verifieldCommentId,
            likedBy:req?.user?._id
        })
        message="You've successfully liked this Comment!"
    }
    res.status(200).json(new ApiResponse(200,message))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const verifieldTweetId=verifyId(tweetId)
    const isTweetExist=await Tweet.findById(verifieldTweetId)
    if (!isTweetExist) {
        throw new ApiError(400,"Tweet Not Found")
    }
    let message;
    const response=await Like.findOneAndDelete({
        $and:[
            {tweet:verifieldTweetId},
            {likedBy:req?.user?._id}
        ]
    })
    if (response) {
        message="Your like has been removed from this Tweet."
    }else{
        await Like.create({
            tweet:verifieldTweetId,
            likedBy:req?.user?._id
        })
        message="You've successfully liked this Tweet!"
    }
    res.status(200).json(new ApiResponse(200,message))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const response=await Like.aggregate([
       {$match:{
        $and:[{likedBy:req?.user?._id},{video:{$exists:true}}]
       }}
    ])
    res.status(200).json(new ApiResponse(200,response))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
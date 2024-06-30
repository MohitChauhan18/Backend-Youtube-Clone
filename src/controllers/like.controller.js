import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    if(!videoId) throw new ApiError(400, "Video Id is a required argument")

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid ObjectId")

    const likedVideo = await Like.findOne({
        video: videoId
    })

    let toggleVideoLike 
    if(likedVideo){
        // toggle the video like
        toggleVideoLike = await Like.deleteOne({
            video: videoId
        })
    }
    else{
        toggleVideoLike = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })
    }

    if(!toggleVideoLike){
        throw new ApiError(400, "Something went wrong")
    }

    res.status(200)
    .json( new ApiResponse(200, toggleVideoLike, "Video toggle successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    if(!commentId) throw new ApiError(400, "Comment Id is a required argument")

    if(!isValidObjectId(commentId)) throw new ApiError(400, "Invalid ObjectId")

    const likedComment = await Like.findOne({
        comment: commentId
    })

    let toggleCommentLike 
    if(likedComment){
        // toggle the comment like
        toggleCommentLike = await Like.deleteOne({
            comment: commentId
        })
    }
    else{
        toggleCommentLike = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
    }

    if(!toggleCommentLike){
        throw new ApiError(400, "Something went wrong")
    }

    res.status(200)
    .json( new ApiResponse(200, toggleCommentLike, "Comment toggle successfully"))
    
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    if(!tweetId) throw new ApiError(400, "Tweet Id is a required argument")

    if(!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid ObjectId")

    const likedTweet = await Like.findOne({
        tweet: tweetId
    })

    let toggleTweetLike 
    if(likedTweet){
        // toggle the tweet like
        toggleTweetLike = await Like.deleteOne({
            tweet: tweetId
        })
    }
    else{
        toggleTweetLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
    }

    if(!toggleTweetLike){
        throw new ApiError(400, "Something went wrong")
    }

    res.status(200)
    .json( new ApiResponse(200, toggleTweetLike, "Tweet toggle successfully"))
    
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    
    const likedVideos = await Like.aggregate([
        {
            $match: {
                "likedBy" : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $match: {
                "video": {
                    $exists: true
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                  {
                    $lookup: {
                      from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "videoOwner",
                      pipeline: [
                        {
                          $project: {
                            fullName: 1,
                            username: 1
                          }
                        }
                      ]
                    }
                  }
                ]
                
            }
        },
        {
            $project: {
                likedVideo: 1
            }
        }
        
    ])

    res.status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully" ))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
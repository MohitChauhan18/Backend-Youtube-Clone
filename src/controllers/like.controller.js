import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    console.log("videoId", videoId);

    try {

        const getVideo = await Like.findOne({ video: videoId, likedBy: req.user._id })
        console.log("getVideo", getVideo);


        if (getVideo) {
            const deleteLike = await Like.findByIdAndDelete(getVideo._id)
            if (deleteLike) {
                return res
                    .status(201)
                    .json(
                        new ApiResponse(201, deleteLike, "Video unliked successfully")
                    )
            }
        }

        const updateLike = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        if (updateLike) {
            return res
                .status(201)
                .json(
                    new ApiResponse(201, updateLike, "Video liked successfully")
                )
        }

        // console.log("getVideo", getVideo);
    } catch (error) {
        console.log("error at toggleVideoLike", error);

    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    try {

        const getComment = await Like.findOne({ comment: commentId, likedBy: req.user._id })


        if (getComment) {
            const deleteLike = await Like.findByIdAndDelete(getComment._id)
            if (deleteLike) {
                return res
                    .status(201)
                    .json(
                        new ApiResponse(201, deleteLike, "Comment unliked successfully")
                    )
            }
        }

        const updateLike = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })

        if (updateLike) {
            return res
                .status(201)
                .json(
                    new ApiResponse(201, updateLike, "Comment liked successfully")
                )
        }
    } catch (error) {
        console.log("error at toggleCommentLike", error);
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    try {

        const getTweet = await Like.findOne({ tweet: tweetId, likedBy: req.user._id })
        console.log("getTweet", getTweet);

        if (getTweet) {
            const deleteLike = await Like.findByIdAndDelete(getTweet._id)
            if (deleteLike) {
                return res
                    .status(201)
                    .json(
                        new ApiResponse(201, deleteLike, "Tweet unliked successfully")
                    )
            }
        }

        const updateLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })

        if (updateLike) {
            return res
                .status(201)
                .json(
                    new ApiResponse(201, updateLike, "Tweet liked successfully")
                )
        }

    } catch (error) {
        console.log("error at toggleTweetLike", error);
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    try {
        const likedVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "video"
                }
            },
            {
                $unwind: "$video"
            },
            {
                $match: {
                    "video.isPublished": true
                }
            }
        ]);

        if (likedVideos) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
                )
        }

        return res
            .status(404)
            .json(
                new ApiResponse(404, null, "No liked videos found")
            )
    } catch (error) {
        console.log("error at getLikedVideos", error);
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    // const comments = await Comment.find({ videoId }).skip((page - 1) * limit).limit(limit)

    const comments = await Comment.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
            $project: {
                _id: 1,
                content: 1,

            }
        }
    ])

    if (comments) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, comments, "Comments fetched successfully")
            )
    }

    return res
        .status(404)
        .json(new ApiResponse(404, null, "Comments not found"))


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const { videoId } = req.params
    const { text } = req.body
    // const { userId } = req.user
    console.log("videoId", videoId);

    const comment = await Comment.create({
        content: text,
        video: videoId,
        owner: req.user._id
    })

    if (comment) {
        return res
            .status(201)
            .json(
                new ApiResponse(201, comment, "Comment created successfully")
            )
    }

    return res
        .status(500)
        .json(new ApiResponse(500, null, "Something went wrong at creating comment"))


})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { commentId } = req.params
    const { text } = req.body
    const comment = await Comment.findByIdAndUpdate(commentId, {
        content: text,

    }, {
        new: true
    })

    if (comment) {

        return res
            .status(200)
            .json(
                new ApiResponse(200, comment, "Comment updated successfully")
            )
    }

    return res
        .status(404)
        .json(new ApiResponse(404, null, "Comment not found"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    console.log("commentId", commentId);

    const comment = await Comment.findByIdAndDelete(commentId)

    if (comment) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, comment, "Comment deleted successfully")
            )
    }

    return res
        .status(404)
        .json(new ApiResponse(404, null, "Comment not found"))

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}

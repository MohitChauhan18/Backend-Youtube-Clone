import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid object Id")

    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(400, "Invaid video Id")

    const videoCommentDetails = await Comment.aggregate([
        {
            $match:{
                video: mongoose.Types.ObjectId(videoId)
            }
        }
    ])

    await Comment.aggregatePaginate(videoCommentDetails, {
        page,
        limit
    }).then((result) => {
        res.status(200)
        .json(new ApiResponse(200, result, "comment fetched successful"))
    })

})

const addComment = asyncHandler(async (req, res) => {
    // check whether comment and video id is present, if not throw an error
    
    const { comment } = req.body
    const { videoId } = req.params

    if (!comment || comment.trim() === "") throw new ApiError(400, "comment is required")

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid object id")

    const videoDetail = await Video.findById(videoId)

    if(!videoDetail) throw new ApiError(400, "Invalid video id")

    const addingVideoComment = await Comment.create({
        content: comment,
        video: videoId,
        owner: req.user?._id
    })

    if(!addingVideoComment) throw new ApiError(400, "Something went wrong while adding comment")

    res.status(201)
    .json(new ApiResponse(201, addingVideoComment, "comment added successfully" ))
})

const updateComment = asyncHandler(async (req, res) => {
    // check for commentId and content from req
    // check for comment 
    // check for ownership of the comment, if not throw an error of permisssion denied
    // update and send the response

    const { commentId } = req.params
    const { content } = req.body

    if (!content || content.trim() === "") throw new ApiError(400, "updated comment is required")

    if(!isValidObjectId(commentId)) throw new ApiError(400, "invalid object id")

    const commentDetail = await Comment.findById(commentId)

    if(!commentDetail) throw new ApiError(400, "Invalid object Id")

    if (commentDetail.owner.String() != req.user?._id) throw new ApiError(400, "You don't have permission to update")

    const updatedcommentDetail = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    )

    if(!updatedcommentDetail) throw new ApiError(400, "Invalid object Id")

    res.status(200)
    .json(new ApiResponse(200, commentDetail, "comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if(!isValidObjectId(commentId)) throw new ApiError(400, "invalid object id")

    const commentDetail = await Comment.findById(commentId)

    if(!commentDetail) throw new ApiError(400, "Invalid object Id")

    if (commentDetail.owner.toString() != req.user?._id.toString()) throw new ApiError(400, "You don't have permission to update")

    const deletedResponse = await Comment.findByIdAndDelete(commentId)

    if(!deletedResponse) throw new ApiError(400, "Invalid object Id")

    res.status(200)
    .json(new ApiResponse(200, deletedResponse, "comment delated successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}

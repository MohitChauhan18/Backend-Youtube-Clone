import { response } from "express"
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
        // check if tweet content is present
        // create the tweet and send the response

        const { content } = req.body

        if(! content || content.trim()=== "") throw new ApiError(400, "Tweet content is a required argument ")

        const tweetContent = await Tweet.create({
            content: content,
            owner : req.user?._id
        })

        if(!tweetContent) throw new ApiError(400, "Something went wrong")

        res.status(201)
        .json(new ApiResponse(201, tweetContent, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, userId} = req.params

    if(!userId) throw new ApiError(400, "userId is an required argument")

    if(userId != req.user?._id.toString()) throw new ApiError(400, "Invalid user")

    const tweets = Tweet.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        }
    ])

    await Tweet.aggregatePaginate({
        page,
        limit
    })

    res.status(200)
    .json( new ApiResponse(200, tweets, "Tweets fetched successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    // check for updated tweet content
    // Fetch previous tweet content and then verify the user
    // if user is not same throw an error
    // update the tweet content and send response

    const { content } = req.body
    const { tweetId } = req.params

    if(!content || content.trim() === "") throw new ApiError(400, "Content is a required argument")

    if(!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid object Id")

    const tweetDetail = await Tweet.findById(tweetId)

    if(!tweetDetail) throw new ApiError(400, "Invalid tweet Id")

    if(tweetDetail.owner.isString() === req.user?._id) throw new ApiError(403, "You don't have permission to update the tweet")

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content 
            }
        },
        {
            new: true
        }
    )

    if (!updatedTweet) throw new ApiError(400, "Something went wong")

    res.status(201)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    // check if tweet id is present and its valid
    // check if user has permission to delete the tweet
    // if yes, delete the tweet and send the response

    const { tweetId } = req.params

    if(!tweetId) throw new ApiError(400,"tweetId is a required argument")

    if(!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid object Id")

    const tweetDetail = await Tweet.findById(tweetId)

    if(!tweetDetail) throw new ApiError(400, "Invalid tweet Id")

    if(tweetDetail.owner.isString() === req.user?._id) throw new ApiError(403, "You don't have permission to update the tweet")

    try {
        await Tweet.findByIdAndDelete(tweetId).then(deleteResponse => {
            if(!deleteResponse) throw new ApiError(400, "Invalid tweet Id")
            else{
                res.status(200)
                .json( new ApiResponse(200, {}, "Tweet deleted successfully"))
            }
        }) 
    } catch (error) {
        throw new ApiError(400, "Something went wrong")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}

import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const { text } = req.body

    // const tweet = await new Tweet.create({
    //     content: text,
    //     owner: req.user._id
    // })

    const tweet = await Tweet.create({
        content: text,
        owner: req.user._id
    })

    if (tweet) {
        return res
            .status(201)
            .json(
                new ApiResponse(201, tweet, "Tweet created successfully")
            )
    }
    return res
        .status(500)
        .json(new ApiResponse(500, null, "Something went wrong at creating tweet"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const tweet = await Tweet.find({ owner: req.user._id })

    if (tweet) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, tweet, "Tweets fetched successfully")
            )
    }

    return res
        .status(500)
        .json(new ApiResponse(500, null, "Something went wrong at fetching tweets"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { text } = req.body

    // const tweet = await Tweet.findByIdAndUpdate(tweetId, req.body, {
    //     new: true
    // })

    const tweet = await Tweet.findByIdAndUpdate(tweetId, {
        content: text
    }, {
        new: true
    })

    if (tweet) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, tweet, "Tweet updated successfully")
            )
    }

    return res
        .status(500)
        .json(new ApiResponse(500, null, "Something went wrong at updating tweet"))


})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    if (tweet) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, "Tweet deleted successfully")
            )
    }
    return res
        .status(500)
        .json(new ApiResponse(500, null, "Something went wrong at deleting tweet"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}

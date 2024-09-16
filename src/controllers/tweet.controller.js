import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    // TODO: create tweet
    // Get conatent from req.body
    // check if it is not there
    // get user from accesstoken
    // create a new Tweet from models and save it
    //send the tweet response
    try {
        const { content } = req.body
        if (!content) {
            throw new ApiError(400,"please fill the input box")
        }
        const tweet = await Tweet.create(
            {
                content,
                owner:req.user._id
            }
        )
        if (!tweet) {
            throw new ApiError(400,"Error While tweet is creating and saved")
        }
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            tweet,
            "tweet is created"
        ))
    } catch (error) {
        throw new ApiError(400,error.message||"Something went Wrong while creating tweet")
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    // get userId
    // check if it exist
    // get all tweets of this user
    // return the tweets
    
    try {
        const user = await User.findById(req.params.userId)
        if (!user) {
            throw new ApiError(
                400,
                "User do not exist"
            )
        }
    
        const tweet = await Tweet.find({owner:user._id})
        
        if (tweet.length === 0 ) {
            throw new ApiError(404,"No tweets found")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {tweet},
            "Fetched Tweet"
        ))
    } catch (error) {
        throw new ApiError(400,error.message||"SomeThing went Wrong While getting User")
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    //take content and check it
    //check for tweet
    //verify owner and user of tweet
    //if same update it

    try {
        const {content} = req.body
        if (!content) {
            throw new ApiError(
                400,
                "Please fill the Required fields"
            )
        }
    
        const tweet = await Tweet.findById(req.params?.tweetId)
        if(!tweet){
            throw new ApiError(
                400,
                "tweet do not exist"
            )
        }
        
        if (!((tweet?.owner).equals(req.user?._id))){
            throw new ApiError(
                400,
                "You are not Allowed to Change the Tweet"
            )
        }
        const newTweet = await Tweet.findByIdAndUpdate(
            tweet._id,
            {
                $set:{
                    content,
                }
            },
            {new:true}
        )
    
        return res.status(200).json(
            new ApiResponse(
                200,
                newTweet,
                "Updated Tweet"
            )
        )
    } catch (error) {
        throw new ApiError(400,error.message||"SomeThing went Wrong While updating Tweet")
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    //get Tweet
    //check tweet is there
    //check owner and user
    //delete and send response
    try {
        const tweet = await Tweet.findById(req.params.tweetId)
        if (!tweet) {
            throw new ApiError(400,"No such Tweet found")
        }
        if (!((tweet?.owner).equals(req.user?._id))){
            throw new ApiError(400,"You cannot delete this tweet")
        }
        const response = await Tweet.findByIdAndDelete(tweet._id)
        
        if (!response) {
            throw new ApiError(
                400,
                "Error While Deleting the data"
            )
        }
        return res
        .status(204)
        .json(new ApiResponse(
            204,
            {},
            "Deleted the Tweet"
        ))
    } catch (error) {
        throw new ApiError(400,error.message||"Something went Wrong while deleting Tweet")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}

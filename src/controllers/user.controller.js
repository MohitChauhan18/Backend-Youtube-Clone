import { ApiErrors } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(
    async (req,res)=>{
        //check validation
        //check if user already exist
        //add middleware to upload the avatar and coverImage in localstorage 
        //check if its uploaded in local server=>avatar
        //upload them in cloudinary
        //check if they are uploaded in cloudinary
        //make a object and do a dataentry
        //check if user is added in database
        //if user added successfully then give a response without password and token


        const {email,fullName,userName,password} = req.body

        if(
            [email,password,fullName,userName].some(item=>item?.trim() === "")
        ){
            throw new ApiErrors(400,"All fields are neccessary to sign up")
        }

        const userAlreadyExist = await User.findOne(
            {
                $or:[{email,userName}]
            }
        )

        if(userAlreadyExist){
            throw new ApiErrors(404,"User with this email or username already exist")
        }

        const avatarLoacalPath = req.files?.avatar[0].path
        //const coverImageLocalPath = req.files?.coverImage[0].path
        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 )
        {
            coverImageLocalPath = req.files.coverImage[0].path
        }

        if(!avatarLoacalPath){
            throw new ApiErrors(404,"Avatar is required")
        }

        const avatar = await uploadOnCloudinary(avatarLoacalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if(!avatar){
            throw new ApiErrors(500,"Internal server error")
        }

        const response = await User.create({
            email,
            password,
            fullName,
            avatar:avatar.url,
            coverImage:coverImage?.url || "",
            userName:userName.toLowerCase()
        })

        const user = await User.findById(response._id).select("-password -refreshToken")

        if(!user){
            throw new ApiErrors(505,"Something went wrong when creating a user")
        }

        res.status(200).json(
            new ApiResponse(200,user,"User is successfully registered!")
        )
    }
)

const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiErrors(500,"Something went wrong when generating tokens ")
    }
}

const loginUser = asyncHandler(
    async(req,res) =>{
        //check email,username and password
        //find with username or emali
        //check the password
        //access token and refresh token
        //send cookies 

        const {email,password} = req.body

        if(!email){
            throw new ApiErrors(400,"Please provide email to login !!")
        }

        const user = await User.findOne({email})
        
        if(!user){
            throw new ApiErrors(404,"User with provided email not found!!")
        }

        const isPasswordCorrect = await user.isPasswordCorrect(password)

        if(!isPasswordCorrect){
            throw new ApiErrors(401,"Invalid crediantials for log in ")
        }

        const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

        const newUser = await User.findById(user._id).select("-password -refreshToken")

        const options = {
            httpOnly:true,
            secure:true
        }

        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(200,{
                user:newUser,
                accessToken,
                refreshToken
            },"User logged in successfully!!")
        )

    }
)
const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined
        },
    },{
        new:true
    })
    
    const options = {
        httpOnly:true,
        secure:true
    }

    return res.
    status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"Logged out successfully "))
})

const generateNewAccessToken = asyncHandler(async(req,res)=>{
    //retrive the refresh token
    //decode the refresh token
    //find user based on decoded token 
    //compare both access tokens 
    //generate access and refresh tokens 
    //send response

    const refreshTokenFromReq = req.cookie.refreshToken || req.body.refreshToken

    if(!refreshTokenFromReq){
        throw new ApiErrors(403,"refresh token not found")
    }

    const decodedToken = jwt.verify(refreshTokenFromReq,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id).select("-password -refreshToken")

    if(!user){
        throw new ApiErrors(404,"User not found with the token")
    }

    if(user.refreshToken !== refreshTokenFromReq){
        throw new ApiErrors(403,"refresh token from database and req did not match!!")
    }

    const {newRefreshToken,accessToken} = generateAccessAndRefreshTokens(user._id)


    const options = {
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("refreshToken",newRefreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(new ApiResponse(200,
        {
            accessToken,
            refreshToken:newRefreshToken
        },
        "New access token generated based on provided refresh token !!!"
    ))

})

const changePassword = asyncHandler(async(req,res)=>{

    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiErrors(401,"Your provided old password is incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Your password has been changed"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .stauts(200)
    .json(new ApiResponse(200,req.user,"Provided the user"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {email,userName} = req.body

    if(!email && !userName){
        throw new ApiErrors(403,"Atlease provide email or username")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                email,
                userName
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"email and username is changed successfully"))
})

const updateAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file.path

    if(!avatarLocalPath){
        throw new ApiErrors(402,"avatar is not provided ")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
        throw new ApiErrors(500,"something went wrong when uploading your avatar on cloudnary")
    }

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set:{
            avatar:avatar.url
        }
    },{new:true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"avatar changed successfully"))
})

const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverLocalPath = req.file.path

    if(!coverLocalPath){
        throw new ApiErrors(402,"cover image is not provided ")
    }

    const coverImage = await uploadOnCloudinary(avatarLocalPath)

    if(!coverImage){
        throw new ApiErrors(500,"something went wrong when uploading your cover image on cloudnary")
    }

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set:{
            coverImage:coverImage.url
        }
    },{new:true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"cover Image changed successfully"))
})


const getChannelDetails = asyncHandler(async(req,res)=>{
    const {userName} = req.params

    if(!userName){
        throw new ApiErrors(401,"Please provide username to fetch user details")
    }

    const channel = await User.aggregate([
        {
            $match:{
                userName:userName.toLowerCase()
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    if:{$in:[req.user?.id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        },{
            $project:{
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiErrors(404,"channel does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"user's channel details fetched successfully !!"))
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:{
                                $project:{
                                    fullName:1,
                                    avatar:1,
                                    userName:1
                                }
                            }
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully !!"))
})

export {
    registerUser
    ,loginUser
    ,logoutUser
    ,generateNewAccessToken
    ,changePassword
    ,getCurrentUser
    ,updateAccountDetails
    ,updateAvatar
    ,updateCoverImage
    ,getChannelDetails
    ,getWatchHistory
}
import { asyncHandler } from "../utils/asyncHandler.js"; // helper file and its higher order func
import { Apierror } from "../utils/Apierror.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiRespose.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";

////////// GENERATED ACCESS TOKEN AND REFRESH TOKEN //////////

const generateAccessAndRefreshToken = async ( userID ) =>
{
    try
    {
        const user = await User.findById( userID ) // retrieves the user document from the database using the provided userID

        if ( !user ) { throw new Apierror( 404, "User not found" ); }

        const accessToken = await user.generateAccessToken() // require _id, email, username, fullName
        const refreshToken = await user.generateRefreshToken() // require _id

        user.refresh_token = refreshToken // save the refresh token in DB of particular user id
        await user.save( { validateBeforeSave: false } ) // save the user model

        return { accessToken, refreshToken }

    } catch ( error )
    {
        throw new Apierror( 500, "error in generating tokens" )
    }
}

///////////////////////////////////////////////////////////////////



///////// USED TO REGIESER USER IN DB//////////
// 1. get user details form frontend
// 2. validation for empty fields
// 3. check if user already exists using email
// 4. check for image, avatar form user
// 5. upload image and avater to cloudinary [check image upload by multer then check if its uploaded on cloudinary]
// 6. create user object of details. create entry of this object in database
// 7. remove password and refresh token from response while sending response to frontend
// 8. check if user is registered ? return response : return error
const registerUser = asyncHandler( async ( req, res ) =>
{ // when the user is registered then this function will be executed

    const { fullName, email, username, password } = req.body // get the user details from frontend

    // 2. validation for empty fields
    if ( [ fullName, email, username, password ].some( ( feild ) => feild.trim() === "" ) )
    { // check if any of the field is empty 
        throw new Apierror( 400, "please enter full name" )
    }
    // 3. check if user already exists using email
    const existedUser = await User.findOne( { //findone is a method to find the user or email from DB
        $or: [ { email }, { username } ]
    } )

    if ( existedUser ) { throw new Apierror( 409, "user already exists" ) } // if user already exists then throw an error


    // 4. check for image, avatar form user
    const avatarLocalPath = req.files?.avatar[ 0 ]?.path //req.files is used to get the file from frontend and avatar is the name of the field .avatar[0] is used to get the first file from the array and  it will give u path
    // const coverImageLocalPath = req.files?.coverImage?.path

    let coverImageLocalPath;
    if ( req.files && Array.isArray( req.files.coverImage ) && req.files.coverImage.length > 0 ) // check Array of req.files.coverImage and check their length is greater than 0  
    {
        coverImageLocalPath = req.files.coverImage[ 0 ].path // get the path of the first file from the array
    }

    if ( !avatarLocalPath ) { throw new Apierror( 400, "please upload avatar" ) }

    // 5. upload image and avater to cloudinary [check image upload by multer then check if its uploaded on cloudinary]
    const avatar = await uploadOnCloudinary( avatarLocalPath, "img" ) //takes time to upload image on cloudinary so we use await
    const coverimage = await uploadOnCloudinary( coverImageLocalPath, "img" ) //takes time to upload image on cloudinary so we use await

    if ( !avatar ) { throw new Apierror( 400, "please upload avatar" ) }

    // 6. create user object of details. create entry of this object in database
    const user = await User.create( {
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverimage: coverimage?.url || ''
    } )

    // 7. remove password and refresh token from response while sending response to frontend
    // check whether user is created or not
    const createdUser = await User.findById( user._id ).select( // MongoDB create id for every user
        "-password -refresh_token"
    )

    if ( !createdUser ) { throw new Apierror( 500, "user not created" ) }

    // 8. check if user is registered ? return response : return error
    return res.status( 201 ).json( new ApiResponse( 201, createdUser, 'user registered successfully' ) )
} )


///////////////////////////////////////////////////////////////////



///////// LOGIN USER //////////
// 1. get data from request body
// 2. verify via username or email
// 3. find the user in the database
// 4. if user present then check password
// 5. generate access token and refresh token
// 6. send these token inform of cookies
const loginUser = asyncHandler( async ( req, res ) =>
{
    // 1. get data from request body
    const { email, username, password } = req.body

    // 2. verify via username or email
    if ( !email && !username ) { throw new Apierror( 400, "please provide email or username" ) }

    // 3. find the user in the database based on email or username
    const user = await User.findOne( {
        $or: [ { username }, { email } ] // check if username or email is present in the database
    } ) // this user doesnt contain any refresh token 

    if ( !user ) { throw new Apierror( 404, "user not found" ) }

    // 4. if user present then check password
    const isPasswordValid = await user.isPasswordCorrect( password ) // isPasswordCorrect is a method in user.model.js.
    // return boolen values
    if ( !isPasswordValid ) { throw new Apierror( 401, "Invalid user credentials" ) }


    // 5. generate access token and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken( user._id ) // generateAccessAndRefreshToken is top of the code

    // 6. send these token inform of cookies
    const loggedInUSer = await User.findById( user._id ).select( "-password -refresh_token" ) // remove password and refresh token from response
    // return user details without password and refresh token

    const options = { // options for cookie
        httpOnly: true, // cookie is only accessible by the server
        secure: true // cookie is only accessible by https
    }

    return res
        .status( 200 )
        .cookie( "accessToken", accessToken, options )
        .cookie( "refreshToken", refreshToken, options )
        .json(
            new ApiResponse(
                200, { user: loggedInUSer, accessToken, refreshToken }, // when user want to save the token in local storage 
                "User logged in successfully" // response message
            )
        )

} )
///////////////////////////////////////////////////////////////////


////////// Logout User //////////
// 1. VERFY USER USING VERIFYJWT MIDDLEWARE
// 2. update refresh token to undefinded of particular user
// 3. clear cookies
// 4. remove refresh token
const logoutUser = asyncHandler( async ( req, res ) =>
{
    // 1. update refresh token to undefinded of particular user
    // req.user is added by verifyJWT middleware
    await User.findByIdAndUpdate( // find the user by id and update the refresh token to null
        req.user._id, // find the user by id
        {
            $unset: { refresh_token: 1 } // $unset: This is a MongoDB operator used undefine the field
        }, {
        new: true // new: true: This option tells Mongoose to return the updated document after the update or mongoose will return old doc
    }
    )

    // 2. clear cookies
    const options = { // options for cookie
        httpOnly: true, // cookie is only accessible by the server
        secure: true // cookie is only accessible by https
    }

    return res.status( 200 )
        .clearCookie( "accessToken", options )
        .clearCookie( "refreshToken", options )
        .json( new ApiResponse( 200, {}, "User logged out successfully" ) )
} )
///////////////////////////////////////////////////////////////////


//////////RENEW THE ACCESS TOKEN //////////
// when the access token is expired then we use refresh token to generate new access token

// 1. get refresh token from cookies
// 2. verify refresh token using jwt.verify
// 3. find users on decoded token from db
// 4. compare the refresh token in db with the incoming refresh token
// 5. generate new access token and refresh token
// 6. send these token inform of cookies to users browser
const refreshAccessToken = asyncHandler( async ( req, res ) =>
{
    // 1. get refresh token from cookies
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken // get the users refresh token from cookies or body

    if ( !incomingRefreshToken ) { throw new Apierror( 401, "Unauthorized request" ) }

    try
    {
        // 2. verify refresh token using jwt.verify
        const decodedIncomingToken = jwt.verify( incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET ) // requied secret key or public key to decode token

        // 3. find users on decoded token from db 
        const user = await User.findById( decodedIncomingToken?._id ).select( "-password" ) //find the user by id

        if ( !user ) { throw new Apierror( 401, "Invalid refresh token" ) }

        // 4. compare the refresh token in db with the incoming refresh token
        if ( user.refresh_token !== incomingRefreshToken ) { throw new Apierror( 401, "Refres token is expired or used" ) }

        // 5. generate new access token and refresh token
        const options = { // options for cookie
            httpOnly: true, // cookie is only accessible by the server
            secure: true // cookie is only accessible by https
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken( user._id )


        // 6. send these token inform of cookies to users browser
        return res.status( 200 )
            .cookie( "accessToken", accessToken, options ) //set a cookie named "accessToken" in the client's browser. key-value pair
            .cookie( "refreshToken", newRefreshToken, options )
            .json(
                new ApiResponse( 200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully" )
            )
    } catch ( error )
    {
        throw new Apierror( 401, "Invalid refresh token" )
    }


} )

///////////////////////////////////////////////////////////////////

////////// CHANGE CURRENT PASSWORD //////////
// 1. get the oldpassword, new password  from the frontend
// 2. find the user by user._id. // req.user is added by verifyJWT middleware
// 3. check if oldpassword is correct.   isPasswordCorrect is already defined in user.model.js
const changeCurrentPassword = asyncHandler( async ( req, res ) =>
{
    // 1. get the oldpassword, new password  from the frontend
    const { oldPassword, newPassword } = req.body

    // 2. Check if both passwords are provided
    if ( !oldPassword || !newPassword ) { return res.status( new Apierror( 400, "Both old and new passwords are required" ) ); }

    // 2. find the user by user._id. // req.user is added by verifyJWT middleware
    const user = await User.findById( req.user?._id )

    // 3. check if oldpassword is correct.   isPasswordCorrect is already defined in user.model.js
    const isPasswordValid = await user.isPasswordCorrect( oldPassword ) // isPasswordCorrect is a method in user.model.js.
    if ( !isPasswordValid ) { throw new Apierror( 401, "oldpassword is incorrect" ) }

    // 4. update the password and save the user
    user.password = newPassword
    await user.save( { validateBeforeSave: false } )

    return res.status( 200 )
        .json( new ApiResponse( 201, {}, "password upaded successfully" ) )
} )
///////////////////////////////////////////////////////////////////


////////// GET CURRENT USER //////////
// 1. get the user from req.user. // req.user is added by verifyJWT middleware
const getCurrentUser = asyncHandler( async ( req, res ) =>
{
    return res.status( 200 )
        .json( new ApiResponse( 200, req.user, "user found" ) )
} )

///////////////////////////////////////////////////////////////////

////////// UPDATE ACCOUNT DETAILS //////////
// 1. get email, fullName from frontend
// 2. update the user details in the database  // req.user is added by verifyJWT middleware
const updateAccountDetails = asyncHandler( async ( req, res ) =>
{
    const { email, fullName } = req.body

    if ( !email || !fullName ) { throw new Apierror( 400, "please provide email and fullName" ) }

    const Updateduser = await User.findByIdAndUpdate( req.user?._id, // req.user is added by verifyJWT middleware
        { $set: { email: email, fullName } }, { new: true } // return updated info instead of old info
    ).select( "-password" ) //remove password from response

    return res.status( 200 )
        .json( new ApiResponse( 200, Updateduser, "user details updated successfully" ) )
} )

///////////////////////////////////////////////////////////////////

////////// UPADTE USER AVATARIMAGES //////////
// 1. get the new avatar image from frontend
// 2. upload the image on local storage
// 3. upload the image on cloudinary
// 3.3 delete the old avatar image from cloudinary
// 4. update the user avatar in the database // req.user is added by verifyJWT middleware
const updateUserAvatar = asyncHandler( async ( req, res ) =>
{
    // 1. get the new avatar image from frontend
    // 2. upload the image on local storage
    const newAvatarLocalPath = req.file?.path

    if ( !newAvatarLocalPath ) { throw new Apierror( 400, "please upload avatar" ) }

    // 3. upload the image on cloudinary
    const newAvatarCloudnary = await uploadOnCloudinary( newAvatarLocalPath, "img" )

    if ( !newAvatarCloudnary ) { throw new Apierror( 400, "please upload avatar" ) }

    // 3.3 delete the old avatar image from cloudinary
    // // get the old avatar image from the database
    const oldAvatarUrl = req.user?.avatar

    // // delete the old avatar image from cloudinary
    const deleteOldAvatar = await deleteFromCloudinary( oldAvatarUrl, "img" )

    if ( !deleteOldAvatar ) { throw new Apierror( 400, "avatar not found" ) }

    // 4. update the user avatar in the database
    const updateImage = await User.findByIdAndUpdate( req.user?._id, { $set: { avatar: newAvatarCloudnary.url } }, { new: true } ).select( "-password" )

    // 5. update the user avatar in the database
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: newAvatarCloudnary.url } },
        { new: true }
    ).select( "-password" );

    return res.status( 200 ).json( new ApiResponse( 200, updatedUser, "Avatar updated successfully" ) );
} );
///////////////////////////////////////////////////////////////////


////////// UPADTE USER COVERIMAGES //////////
// 1. get the new avatar image from frontend
// 2. upload the image on local storage
// 3. upload the image on cloudinary
// 4. update the user avatar in the database // req.user is added by verifyJWT middleware
const upadteUserCoverImage = asyncHandler( async ( req, res ) =>
{
    try
    {
        // 1. get the new cover image from frontend
        // 2. upload the image on local storage
        const newCoverImageLocalPath = req.file?.path

        if ( !newCoverImageLocalPath ) { throw new Apierror( 400, "please upload CoverImage" ) }

        // 3. upload the image on cloudinary
        const newCoverImageCloudnary = await uploadOnCloudinary( newCoverImageLocalPath, "img" )

        if ( !newCoverImageCloudnary ) { throw new Apierror( 400, "Image not uploaded on cloudinary" ) }

        // 3.3 delete the old cover image from cloudinary
        // // get the old cover image from the database
        const oldCoverUrl = req.user?.avatar

        // // delete the old Cover image from cloudinary
        const deleteOldCover = await deleteFromCloudinary( oldCoverUrl, "img" )

        if ( !deleteOldCover ) { throw new Apierror( 400, "coverimage not found" ) }


        // 4. update the user avatar in the database // req.user is added by verifyJWT middleware
        const updateImage = await User.findByIdAndUpdate( req.user?._id, { $set: { avatar: newCoverImageCloudnary.url } }, { new: true } ).select( "-password" )

        return res.status( 200 )
            .json( new ApiResponse( 200, updateImage, "CoverImage upadte successfully" ) )

    } catch ( error )
    {
        return res.status( 500 ).json( new Apierror( 500, {}, "error in updating cover image" ) )

    }
} )

///////////////////////////////////////////////////////////////////



////////// getUserChannelProfile //////////
// 1. get the username from the params(URL) front end
// 2. find the particular user by username in DB using aggregate
//  a. find total number of subs of particular channel by using $lookup. (to count the subsribers select the doc where channel is particular chanel)
//  b. find total number of channels subscribed by the user by using $lookup. (to count the channels subscribed by the user select the doc where subscriber is particular user)
//  c. add total subscriberCount of particular channel and total channelSubscribedToCount (particular channel is subscribed to how many channel ) of particular user
//  d. select the fields which we want to return using $project
const getUserChannelProfile = asyncHandler( async ( req, res ) =>
{
    // 1. get the username from the params(URL) front end
    const { username } = req.params // you will get the username from the params(URL)

    if ( !username ) { throw new Apierror( 400, "please provide username" ) }

    // 2. find the user by username in DB using Where clause
    // User.find({ username: username }) // find the user by username in DB ""{username: username}"" this is WHERE clause 
    const ChannelName = await User.aggregate( [
        { $match: { username: username?.toLowerCase() } }, // find username by using $match it will return one user object
        {
            //  a. find total number of subs of particular channel by using $lookup. (to count the subsribers select the doc where channel is particular chanel)
            // find total number of subs of particular channel
            $lookup: {    // $lookup is used to join the collections
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            //  b. find total number of channels subscribed by the user by using $lookup. (to count the channels subscribed by the user select the doc where subscriber is particular user) 
            // find total number of channels subscribed by the user
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            //  c. add total subscriberCount of particular channel and total channelSubscribedToCount (particular channel is subscribed to how many channel ) of particular user
            // $addFields is used to add new fields in main user object
            //  add total subscriberCount of particular channel and total channelSubscribedToCount (particular channel is subscribed to how many channel ) of particular user
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers" //  '$' is used to access the field of the document
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {     // check if the user is subscribed to the channel or not  (check channel is present in subscriber or not)
                    $cond: {    // if{condition} then{true} else{false}
                        if: { $in: [ req.user?._id, "$subscribers.subscriber" ] },  // check the particular user is subscribed to the channel or not  // req.user?._id is user and $subscribers is feild of user and subscriber is particular channel
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // $project is used to select the fields which we want to return
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverimage: 1,
                email: 1
            }
        }
    ] )

    if ( !ChannelName?.length ) { throw new Apierror( 404, "Channel not found" ) }


    return res.status( 200 )
        .json( new ApiResponse( 200, ChannelName[ 0 ], "Channel found" ) )
} )

///////////////////////////////////////////////////////////////////


////////// getWatchHistory //////////
// purpose -> get user -> get his watch history -> get the video of the watch history and put ower details in the objet
// 1. get the user from frontend
// 2. get the watch history of the user
//  a. get the user in DB
//  b. get the watch history of the user
//  c. get watch history of the user using video id -> in video collection
//  d. get the owner of the video using nested pipeline and project the fields which we want to return 
const getWatchHistory = asyncHandler( async ( req, res ) =>
{
    try
    {
        const userId = req.user?._id;

        // Check if userId exists
        if ( !userId )
        {
            return res.status( 400 ).json( new ApiResponse( 400, null, "User ID is required" ) );
        }

        // 1. get the user from frontend
        // 2. get the watch history of the user
        const user = await User.aggregate( [ {
            //  a. get the user in DB
            $match: { _id: new mongoose.Types.ObjectId( userId ) },   // if we use req.user._id it will return string like this "ObjectId('5a9427648b0beebeb69579e7')"
            //  b. get the watch history of the user
            //  c. get watch history of the user using video id -> in video collection
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [ {    //  d. get the owner of the video using nested pipeline and project the fields which we want to return 
                    $lookup: {
                        from: "users",
                        localField: "Owner",
                        foreignField: "_id",
                        as: "Owner",
                        pipeline: [ {
                            $project: {
                                fullName: 1,
                                username: 1,
                                avatar: 1
                            }
                        } ]
                    }
                },
                {  // it will just return object instead of array
                    $addFields: {    // overwrite owner field with first element of owner array
                        owner: { $arrayElemAt: [ "$Owner", 0 ] }
                    }
                }
                ]
            },


        } ] )

        if ( !user || user.length === 0 )
        {
            return res.status( 404 ).json( new ApiResponse( 404, null, "User not found" ) );
        }

        return res.status( 200 )
            .json( new ApiResponse( 200, user[ 0 ].watchHistory, "Watch history found" ) )

    } catch ( error )
    {
        return res.status( 500 ).json( new Apierror( 500, {}, "error in getting watch history" ) )

    }
}
)


export
{
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    upadteUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
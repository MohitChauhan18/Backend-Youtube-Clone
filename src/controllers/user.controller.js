import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  destoryOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);
  // console.log("email: ", avatar);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(avatarLocalPath);
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  console.log(coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  console.log(user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { email, username, password } = req.body;
  console.log(email);

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  console.log(user);

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  console.log(loggedInUser);

  // const options = {
  //     httpOnly: true,
  //     secure: true
  // }

  // return res
  // .status(200)
  // .cookie("accessToken", accessToken, options)
  // .cookie("refreshToken", refreshToken, options)
  // .json(
  //     new ApiResponse(
  //         200,
  //         {
  //             user: loggedInUser, accessToken, refreshToken
  //         },
  //         "User logged In Successfully"
  //     )
  // )

  res.setHeader(
    "Set-Cookie",
    `accessToken=${accessToken}; Max-Age=${
      1 * 24 * 60 * 60 * 1000
    }; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
  );

  // res.setHeader(
  //   "Set-Cookie",
  //   `__Host-refreshToken=${refreshToken}; Max-Age=${10 * 24 * 60 * 60 * 1000}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
  // );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  res.setHeader(
    "Set-Cookie",
    `accessToken=; Max-Age=-1; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, email, username, description } = req.body;

  if (!fullName && !email && !username && !description) {
    throw new ApiError(400, "At least one field required");
  }

  const user = await User.findById(req.user?._id);

  if (fullName) user.fullName = fullName;

  if (email) user.email = email;

  if (description) user.description = description;

  if (username) {
    const isExists = await User.find({ username });
    if (isExists?.length > 0) {
      throw new ApiError(400, "Username not available");
    } else {
      user.username = username;
    }
  }

  const updatedUserData = await user.save();

  if (!updatedUserData) {
    new ApiError(500, "Error while Updating User Data");
  }

  delete updatedUserData.password;

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUserData, "Profile updated Successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  let userDetail;
  try {
    // Find user once
    userDetail = await User.findById(req.user?._id).select("-password ");
    console.log(userDetail);

    // Delete old avatar image from Cloudinary
    const avatarURL = userDetail.avatar;
    const publicId = avatarURL.split("/").pop().split(".")[0];
    await destoryOnCloudinary(publicId);
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw new ApiError(500, "Error updating avatar");
  }

  try {
    // Upload new avatar image to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
      throw new ApiError(400, "Error while uploading avatar");
    }

    // Update user's avatar URL in database
    userDetail.avatar = avatar.url;
    const updatedUser = await userDetail.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedUser, "Avatar image updated successfully")
      );
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw new ApiError(500, "Error updating avatar");
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  console.log(updateUserCoverImage);

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  //TODO: delete old image - assignment
  let userDetail;
  try {
    // Find user once
    userDetail = await User.findById(req.user?._id).select("-password ");

    // Delete old avatar image from Cloudinary
    const coverImageURL = userDetail.coverImage;
    const publicId = coverImageURL.split("/").pop().split(".")[0];
    await destoryOnCloudinary(publicId);

    console.log("delted old coveri age sucessfully");
  } catch (error) {
    console.error("Error deleting coverimage:", error);
    throw new ApiError(500, "Error deleting coverimage");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  console.log(username);

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const userWatchHistory = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
    {
      $project: {
        watchHistory: 1,
      },
    },
  ]);

  let watchHistory = userWatchHistory[0].watchHistory;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        watchHistory.reverse(),
        "History Fetched Successfully"
      )
    );
});

//     const userWatchHistory = await User.aggregate([
//       {
//         $match: {
//           _id: new mongoose.Types.ObjectId(req.user._id),
//         },
//       },
//       {
//         $lookup: {
//           from: "videos",
//           localField: "watchHistory",
//           foreignField: "_id",
//           as: "watchHistory",
//           pipeline: [
//             {
//               $lookup: {
//                 from: "users",
//                 localField: "owner",
//                 foreignField: "_id",
//                 as: "owner",
//                 pipeline: [
//                   {
//                     $project: {
//                       username: 1,
//                       fullName: 1,
//                       avatar: 1,
//                     },
//                   },
//                 ],
//               },
//             },
//             {
//               $addFields: {
//                 owner: {
//                   $first: "$owner",
//                 },
//               },
//             },
//           ],
//         },
//       },
//       {
//         $project: {
//           watchHistory: 1,
//         },
//       },
//     ]);

//     let watchHistory = userWatchHistory[0].watchHistory;

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           watchHistory.reverse(),
//           "History Fetched Successfully"
//         )
//       );
//   });

const clearWatchHistory = asyncHandler(async (req, res) => {
  const isCleared = await User.findByIdAndUpdate(
    new mongoose.Types.ObjectId(req.user?._id),
    {
      $set: {
        watchHistory: [],
      },
    },
    {
      new: true,
    }
  );
  if (!isCleared) throw new ApiError(500, "Failed to clear history");
  return res
    .status(200)
    .json(new ApiResponse(200, [], "History Cleared Successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserProfile,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  clearWatchHistory,
};

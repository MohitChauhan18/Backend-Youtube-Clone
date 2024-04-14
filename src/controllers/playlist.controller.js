import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { verifyId } from "../utils/verifyId.js";
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description, videos = [] } = req.body;
  const { _id } = req?.user;
  if (!name || !description) {
    throw new ApiError(400, "Both field are required");
  }

  if (videos?.length) {
    const objectIds = videos.map((id) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (error) {
        throw new ApiError(400, "Invalid video ID:" + id);
      }
    });

    const checkId = await Video.find({
      _id: { $in: objectIds },
    });
    if (!(checkId?.length === objectIds.length)) {
      throw new ApiError(400, "Invalid video ID");
    }
  }
  const response = await Playlist.create({
    name,
    description,
    owner: _id,
    videos,
  });
  if (!response) {
    throw new ApiError(500, "Something went wrong");
  }
  res
    .status(200)
    .json(new ApiResponse(200, response, "Playlist created SuccessFully"));
  //TODO: create playlist
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  let userObjectId;
  try {
    userObjectId = new mongoose.Types.ObjectId(userId);
  } catch (error) {
    throw new ApiError(400, "Id is not valid");
  }
  const findUser = await User.findById(userId);
  if (!findUser) {
    throw new ApiError(400, "User not found");
  }
  const playlistResponse = await Playlist.aggregate([
    {
      $match: { owner: userObjectId },
    },
    {
      $unwind: "$videos",
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videoDetail",
        pipeline: [
          {
            $project: {
              _id: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              owner: 1,
            },
          },
          {
            $lookup: {
              localField: "owner",
              foreignField: "_id",
              from: "users",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
          //   {
          //     $project: {
          //       _id: 1,
          //       username: 1,
          //       email: 1,
          //       fullname: 1,
          //       avatar: 1,
          //     },
          //   },
        ],
      },
    },
    {
      $addFields: {
        videoDetail: {
          $first: "$videoDetail",
        },
      },
    },

    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        description: { $first: "$description" },
        videos: { $push: "$videoDetail" },
      },
    },
  ]);
  res.status(200).json(new ApiResponse(200, playlistResponse));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlistObjectId = verifyId(playlistId);
  const playList = await Playlist.aggregate([
    {
      $match: { _id: playlistObjectId },
    },
    {
      $lookup: {
        localField: "owner",
        from: "users",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              email: 1,
              fullname: 1,
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
    {
      $unwind: "$videos",
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              _id: 1,
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
            },
          },
        ],
      },
    },
    {
        $addFields:{
            videos:{
                $first:"$videos"
            }
        }
    },
    {
        $group:{
            _id:"$_id",
            name:{$first:"$name"},
            description:{$first:"$description"},
            videos:{$push:"$videos"}
        }   
    },
    
  ]);
  if (!playList) {
    throw new ApiError(400, "PlayList Not Found");
  }

  res.status(200).json(new ApiResponse(200, playList?.[0] || null));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  // Verify playlistId
  const verifiedPlaylistId = verifyId(playlistId);

  // Verify videoId
  const verifiedVideoId = verifyId(videoId);

  // Find the playlist
  const playlist = await Playlist.findOne({
    $and: [
      { _id: verifiedPlaylistId },
      { owner: req?.user?._id }
    ]
  });

  if (!playlist) {
    throw new ApiError(400, "PLaylist Not Found or You are unable to access this playlist");
  }

  // Find the video
  const video = await Video.findById(verifiedVideoId);
  if (!video) {
    throw new ApiError(400, "Video Not Found");
  }
  if (playlist.videos.includes(verifiedVideoId)) {
    throw new ApiError(400, "Video already in playlist");
  }
  // Add the video to the playlist
  playlist.videos.push(verifiedVideoId);
  await playlist.save();

  res.status(200).json(new ApiResponse(200, "Video added into your playlist"));
});


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const verifiedPlaylistId=verifyId(playlistId)
  const verifiedVideoId=verifyId(videoId)
  const response=await Playlist?.findOneAndUpdate({
    $and:[
      {
        _id:verifiedPlaylistId
      },{
        owner:req?.user?._id
      },
      {
        videos:{$in:verifiedVideoId}
      }
    ]
  },{
    $pull:{videos:verifiedVideoId}
  },{
    new:true
  })
  if (!response) {
    throw new ApiError(400,"Playlist Not Found or Video does not exist in the playlist")
  }

  res.status(200).json(new ApiResponse(200,response))
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const verifiedPlaylistId=verifyId(playlistId)
  const response=await Playlist.findOneAndDelete({
    $and:[
      {_id:verifiedPlaylistId},
      {owner:req?.user?._id}
    ]
  })
  if (!response) {
    throw new ApiError(400,"You can't delete this playlist as it doesn't belong to you or it doesn't exist.")
  }

  res.status(200).json(new ApiResponse(200,"Playlist Delete SuccessFully"))
  console.log(response,"response")
  
  
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const verifiedPlaylistId=verifyId(playlistId)
  const { name, description } = req.body;
  if (!name && !description) {
      throw new ApiError(400,"Please provide at least one field if you want to update playlist details.")
  }
  const response=await Playlist.findOne({
    $and:[{
      _id:verifiedPlaylistId
    },{
      owner:req?.user?._id
    }]
  })
  if (!response) {
    throw new ApiError(400,"Sorry, you're unable to update the playlist details. This could be because you're not the owner, or the playlist doesn't exist.")
  }
  if (name) {
    response.name=name
  }
  if (description) {
    response.description=description
  }
  response.save()
  res.status(200).json(new ApiResponse(200,"Playlist update successFully"))

});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

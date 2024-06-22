import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
     const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  if (
    isNaN(pageNumber) ||
    isNaN(limitNumber) ||
    pageNumber < 1 ||
    limitNumber < 1
  ) {
    return new ApiError(400, "Invalid pagination parameters");
  }

  // Create filter object
  let filter = { owner: userId };
  if (query) {
    // Using $or to search in both title and description fields
    filter.$or = [
      { title: { $regex: query, $options: "i" } }, // Case-insensitive search
      { description: { $regex: query, $options: "i" } },
    ];
  }
  // Create sort object
  const sort = {};

  if (sortBy) {
    sort[sortBy] = sortType === "desc" ? -1 : 1;
  }

  // No of Videos for skipping
  const skip = (pageNumber - 1) * limitNumber;

  const video = await Video.find(filter)
    .skip(skip)
    .sort(sort)
    .limit(limitNumber);
  if (!video) {
    throw new ApiError(401, "No Video found for user");
  }
  res
    .status(200)
    .json(new ApiResponse(200, video, "All videos fetched Successfully"));

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title || !description) {
    throw new ApiError(401, "Title and description is required");
  }

  try {
    const videoPath = req.files?.videoFile[0].path;
    const videoThumnail = req.files?.thumbnail[0].path;

    if (!videoPath) {
      throw new ApiError(401, "Video Local Path is Required");
    }
    if (!videoThumnail) {
      throw new ApiError(401, "Video Thumnail Path is Required");
    }

    const videoUrl = await uploadCloudinary(videoPath);
    const thumnailUrl = await uploadCloudinary(videoThumnail);
    console.log("video url", videoUrl);
    console.log("thumnail url ", thumnailUrl);

    if (!videoUrl) {
      throw new ApiError(
        401,
        "error occurred while uploading video on cloudinary"
      );
    }
    if (!videoThumnail) {
      throw new ApiError(
        401,
        "error occurred while uploading thumbnail on cloudinary"
      );
    }

    const videoData = await Video.create({
      title,
      description,
      videoFile: videoUrl?.url || "",
      thumbnail: thumnailUrl?.url || "",
      duration: videoUrl?.duration,
    });

    res
      .status(200)
      .json(new ApiResponse(200, videoData, "video Published Successfully"));

    console.log(videoData);
  } catch (error) {
    throw new ApiError(
      401,
      "error occurred while publishing video  on SilentTube " + error
    );
  }})

const getVideoById = asyncHandler(async (req, res) => {
   const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.findOne({ _id: videoId });
  if (!video) {
    throw new ApiError(401, "No Video found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched Successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
const { videoId } = req.params;
  const { title, description } = req.body;

  try {
    const localThumbnailPath = req.file?.path;
    console.log(localThumbnailPath);

    if (!localThumbnailPath) {
      throw new ApiError(401, "Thumbnail path is required");
    }

    const thumbnail = await uploadCloudinary(localThumbnailPath);
    console.log(thumbnail?.url);

    if (!thumbnail) {
      throw new ApiError(401, "Thumbnail is required");
    }

    //TODO: update video details like title, description, thumbnail
    const video = await Video.findOneAndUpdate(
      { _id: videoId },
      {
        title,
        description,
        thumbnail: thumbnail?.url,
      },
      { new: true }
    );

    res
      .status(200)
      .json(new ApiResponse(200, video, "Video updated successfully"));
  } catch (error) {
    throw new ApiError(401, "Some error occurred while updating " + error);
  }
})

const deleteVideo = asyncHandler(async (req, res) => {
 const { videoId } = req.params;
  //TODO: delete video

  const video = await Video.findByIdAndDelete(videoId);
  if (!video) {
    throw new ApiError(401, "Video not found");
  }

  res.status(200),
    res.json(new ApiResponse(200, video, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
 const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const status = await Video.findById(videoId).select("isPublished");

  if (!status) {
    throw new ApiError(401, "video is not published");
  }
  res.status(200).json(new ApiResponse(200, status, "published"));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

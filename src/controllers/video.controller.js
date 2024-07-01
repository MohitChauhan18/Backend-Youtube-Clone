import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { deleteOnCloudinary } from "../utils/cloudinarydelete.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query
    const sortOrder = sortType === 'desc' ? -1 : 1;

    let aggregationPipeline = [];

    // Filtering
    if (query) {
        aggregationPipeline.push({
            $match: {
                title: { $regex: query, $options: 'i' },
            }
        });
    }

    if (userId) {
        aggregationPipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            }
        });
    }

    // Lookup owner details
    aggregationPipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails"
        }
    });

    // Unwind the ownerDetails array
    aggregationPipeline.push({
        $unwind: "$ownerDetails"
    });

    // Lookup likes count
    aggregationPipeline.push({
        $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "video",
            as: "likes"
        }
    });

    // Lookup comments count
    aggregationPipeline.push({
        $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "video",
            as: "comments"
        }
    });

    // Project the required fields
    aggregationPipeline.push({
        $project: {
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            duration: 1,
            views: 1,
            isPublished: 1,
            owner: {
                _id: "$ownerDetails._id",
                username: "$ownerDetails.username",
                fullName: "$ownerDetails.fullName",
                avatar: "$ownerDetails.avatar"
            },
            likesCount: { $size: "$likes" },
            commentsCount: { $size: "$comments" },
            createdAt: 1,
            updatedAt: 1
        }
    });

    // Sorting
    aggregationPipeline.push({
        $sort: { [sortBy]: sortOrder }
    });

    // Pagination
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        customLabels: {
            totalDocs: 'totalVideos',
            docs: 'videos'
        }
    };

    try {
        // Fetch videos using the aggregation pipeline and paginate
        const result = await Video.aggregatePaginate(Video.aggregate(aggregationPipeline), options);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    videos: result.videos,
                    totalVideos: result.totalVideos,
                    totalPages: result.totalPages,
                    page: result.page,
                    limit: result.limit
                },
                "Videos fetched successfully"
            )
        );
    } catch (err) {
        return res.status(500).json(new ApiResponse(500, null, 'Error fetching videos: ' + err.message));
    }
});
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    const userId = req.user._id

    const videoFilelocal = req.files?.videoFile[0]?.path;
    console.log("videoFilelocal", videoFilelocal);

    const thumbnailLocal = req.files?.thumbnail[0]?.path

    console.log("thumbnailLocal", thumbnailLocal);


    if (videoFilelocal && thumbnailLocal) {
        const videoFileupload = await uploadOnCloudinary(videoFilelocal)
        const thumbnailupload = await uploadOnCloudinary(thumbnailLocal)
        console.log("videoFile", videoFileupload);
        console.log("thumbnail", thumbnailupload);


        //assume that initially the vidoe is published defaultl

        //THIS WILL FAIL AS SIZE OF VIDEO FILE IS TOO LARGE TO BE UPLOADED
        //BECAUSE OF MULTER CONFIGURATION
        //AS VIDEO IS STORE ON THE SERVER AND NOT DIRECTLY ON CLOUDINARY FOR GETTING LINK
        try {
            const video = await Video.create({
                videoFile: videoFileupload.url,
                thumbnail: thumbnailupload.url,
                title,
                description,
                owner: userId,
                duration: videoFileupload.duration,

            })

            const getVideo = await Video.findById(video._id).select("-videoFile -thumbnail ")
            // not sending videoFile and thumbnail in response (videoFile and thumbnail are cloudinary url)
            if (getVideo) {
                return res
                    .status(201)
                    .json(new ApiResponse(201, getVideo, "Video created successfully"))
            } else {
                return res
                    .status(500)
                    .json(new ApiResponse(500, null, "Something went wrong at creating video"))


            }

        } catch (error) {
            console.log("error", error);

        }
    }



})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    //TODO: get video by id

    console.log("videoId", videoId);

    try {

        const getVideoById = await Video.findById(videoId)
        console.log("getVideoById", getVideoById);

        if (getVideoById) {

            return res
                .status(200)
                .json(new ApiResponse(200, getVideoById, "Video fetched successfully"))
        }

        return res
            .status(404)
            .json(new ApiResponse(404, null, "Video not found"))

    } catch (error) {

        console.log("error", error);

    }




})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body
    console.log("title", title);
    // const testreq = req
    // console.log("req user", testreq);


    try {
        const thumbnailLocal = req.file?.path
        // console.log("thumbnailLocal", thumbnailLocal);
        // let thumbnailLocal;
        // if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        //     thumbnailLocal = req.files.thumbnail[0].path
        // }

        console.log("thumbnailLocal", thumbnailLocal);

        const getVideo = await Video.findById(videoId)

        if (!getVideo) {
            return res
                .status(404)
                .json(new ApiResponse(404, null, "Video not found"))
        }
        if (getVideo.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json(new ApiResponse(403, null, "You are not authorized to update this video"));
        }

        if (getVideo.title !== title) {
            const updateTitle = await Video.findByIdAndUpdate(videoId, {
                title
            })
            if (!updateTitle) {
                return res
                    .status(500)
                    .json(new ApiResponse(500, null, "Something went wrong at updating title"))
            }
        }

        if (getVideo.description !== description) {
            const updateDescription = await Video.findByIdAndUpdate(videoId, {
                description
            })
            if (!updateDescription) {
                return res
                    .status(500)
                    .json(new ApiResponse(500, null, "Something went wrong at updating description"))
            }
        }
        const publicUrl = getVideo.videoFile

        if (thumbnailLocal && getVideo) {

            const thumbnailupload = await uploadOnCloudinary(thumbnailLocal)


            const updateThumbnail = await Video.findByIdAndUpdate(videoId, {
                thumbnail: thumbnailupload.url
            })
            if (!updateThumbnail) {
                return res
                    .status(500)
                    .json(new ApiResponse(500, null, "Something went wrong at updating thumbnail"))
            }

            if (updateThumbnail) {
                try {
                    await deleteOnCloudinary(publicUrl)

                    return res
                        .status(200)
                        .json(new ApiResponse(200, updateThumbnail, "Video updated successfully"))
                } catch (error) {
                    console.log("error", error);
                    return res
                        .status(500)
                        .json(new ApiResponse(500, null, "Something went wrong at deleting video"))
                }
            }


        }
    } catch (error) {
        console.log("error", error);
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    try {
        const getVideo = await Video.findById(videoId)
        if (!getVideo) {
            return res
                .status(404)
                .json(new ApiResponse(404, null, "Video not found"))
        }
        if (getVideo.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json(new ApiResponse(403, null, "You are not authorized to delete this video"));
        }

        const publicvideoUrl = getVideo.videoFile
        const publicthumbnailUrl = getVideo.thumbnail
        const deleteVideo = await Video.findByIdAndDelete(videoId)
        if (!deleteVideo) {
            return res
                .status(500)
                .json(new ApiResponse(500, null, "Something went wrong at deleting video"))
        }
        if (deleteVideo) {
            try {
                await deleteOnCloudinary(publicvideoUrl)
                await deleteOnCloudinary(publicthumbnailUrl)

                return res
                    .status(200)
                    .json(new ApiResponse(200, null, "Video deleted successfully"))
            } catch (error) {
                console.log("error", error);
            }
        }

    } catch (error) {
        console.log("error", error);
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    //TODO: toggle publish status

    try {

        var getVideo = await Video.findById(videoId)

        if (!getVideo) {
            return res
                .status(404)
                .json(new ApiResponse(404, null, "Video not found"))
        }

        if (getVideo.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json(new ApiResponse(403, null, "You are not authorized to update this video"));
        }

        const updateStatus = await Video.findByIdAndUpdate(videoId, {
            isPublished: !getVideo.isPublished
        })

        // console.log("updateStatus", updateStatus);



        if (!updateStatus) {
            return res
                .status(500)
                .json(new ApiResponse(500, null, "Something went wrong at updating status"))
        }

        getVideo = await Video.findById(videoId).select("-videoFile -thumbnail ")
        return res
            .status(200)
            .json(new ApiResponse(200, getVideo, "Status updated successfully"))
    } catch (error) {
        console.log("error", error);
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

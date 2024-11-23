import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

// Get All Videos
const getAllvideos = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      query = "",
      sortBy = "createdAt",
      sortType = "asc",
    } = req.query;

    // get all videos based on query, sort, pagination

    const videos = await Video.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "videoBy",
        },
      },
      {
        $unwind: {
          path: "$videoBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          thumbnail: 1,
          videofile: 1,
          title: 1,
          description: 1,
          videoBy: {
            fullName: "$videoBy.fullName",
            username: "$videoBy.username",
            avatar: "$videoBy.avatar",
          },
        },
      },
      {
        $sort: {
          [sortBy]: sortType === "asc" ? 1 : -1,
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "fetched successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

// Publish Videos
const publishAVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description, duration } = req.body;

    // Validate input
    if ([title, description, duration].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "Please provide title and description");
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) {
      throw new ApiError(
        400,
        "Provide proper video and thumbnail to publish a video."
      );
    }
    //uploadon cloudinary
    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    // Check if uploads were successful
    if (!video || !thumbnail) {
      throw new ApiError(
        500,
        "An error occurred while uploading the video or thumbnail."
      );
    }

    // Create video document in the database

    const uploadedvideo = await Video.create({
      title,
      owner: req.user._id,
      description,
      videoFile: video.url,
      thumbnail: thumbnail.url,
      duration: video.duration,
    });

    if (!req.user || !req.user._id) {
      throw new ApiError(401, "User not authenticated");
    }
    if (!uploadedvideo) {
      throw new ApiError(
        500,
        "An error occurred while creating the video document."
      );
    }
    return res
      .status(201)
      .json(new ApiResponse(201, uploadedvideo, "Video uploaded successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

// Get Video By_ID
const getVideoById = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId || !mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "provide video id");
    }
    const video = await Video.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(videoId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      {
        $lookup: {
          from: "likes",
          localField: "video",
          foreignField: "_id",
          as: "likes",
        },
      },
      {
        $addFields: {
          TotalLikes: { $size: "$likes" },
          isLiked: {
            $in: [req.user._id, "$likes.likedBy"],
          },
        },
      },
      {
        $lookup: {
          from: "subscribers",
          localField: "owner",
          foreignField: "_id",
          as: "Subscribers",
        },
      },
    ]);
    if (!video || video.length === 0) {
      throw new ApiError(404, "Video not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, video[0], " Video get successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

// Update Video Description and Title
const updatedVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { titleNew, descriptionNew } = req.body;

    if (!videoId || !mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "provide valid videoId");
    }
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not Found");
    }

    if (!video.owner.equals(req.user._id)) {
      throw new ApiError(408, "You have no rights to update this video");
    }

    if (!titleNew && !descriptionNew) {
      throw new ApiError(
        409,
        "Atleast provide title and description to update"
      );
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title: titleNew || title,
          description: descriptionNew || video.description,
        },
      },
      { new: true }
    );

    if (!updatedVideo) {
      throw new ApiError(
        500,
        "Something went wrong when updating video details"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedVideo, "Video details updated successfully")
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

// Video Publish Status
const togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId || !mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "provide valid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    if (!video.owner.equals(req.user._id)) {
      throw new ApiError(408, "You have no rights to update this video");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          ispublished: !video.ispublished,
        },
      },
      { new: true }
    );
    if (!updatedVideo) {
      throw new ApiError(
        500,
        "Something went wrong when toggling publish status"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "Publish status toggled"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

// Delete Video
const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId || !mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "provide valid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "video not found");
    }
    const deleted = await Video.findByIdAndDelete(videoId);

    if (!deleted) {
      throw new ApiError(500, "something went wrong when deleting a video");
    }
    await Like.deleteMany({ video: videoId });

    await Comment.deleteMany({ video: videoId });

    await User.deleteMany(
      { watchHistory: videoId },
      {
        $pull: { watchHistory: videoId },
      }
    );

    return res.status(200).json(new ApiResponse(200, deleted, "deleted"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

export {
  getAllvideos,
  publishAVideo,
  getVideoById,
  updatedVideo,
  togglePublishStatus,
  deleteVideo,
};

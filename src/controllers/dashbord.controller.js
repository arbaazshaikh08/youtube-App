import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";

// Get Channel Stats
const getChannelStats = asyncHandler(async (req, res) => {
  try {
    const info = await Video.aggregate([
      { $match: { owner: req.user._id } },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "liked",
        },
      },
      {
        $addFields: {
          Like: { $size: "$liked" },
          owner: req.user.username,
        },
      },
      {
        $group: {
          _id: null,
          totalLikesCount: {
            $sum: "$likes",
          },
          totalViewsCount: {
            $sum: "$views",
          },
        },
      },
    ]);
    const subscribers = await Subscription.aggregate([
      {
        $match: { channel: req.user._id },
      },
      {
        $group: {
          _id: null,
          subscribers: {
            $sum: 1,
          },
        },
      },
    ]);

    if (!info || !info.length === 0) {
      throw new ApiError(500, "failed to fetch details");
    }
    if (!subscribers || !subscribers.length === 0) {
      throw new ApiError(500, "failed to fetch details");
    }
    const response = {
      subscribers: subscribers[0]?.subscribers || 0,
      likes: info[0]?.totalLikesCount || 0,
      view: info[0]?.totalViewsCount || 0,
    };
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          response,
          "user's channel details fetched successfully"
        )
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

// Get channel videos
const getChannelVideos = asyncHandler(async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      throw new ApiError(400, "Username is missing");
    }
    const user = await User.findOne({ username });
    if (!user) {
      throw new ApiError(404, "channel is not found");
    }

    const videos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(user._id),
          isPublished: true,
        },
      },

      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "liked",
        },
      },
      {
        $addFields: {
          owner: { username },
          likes: {
            size: "liked",
          },
        },
      },
    ]);
    if (videos.length === 0) {
      throw new ApiError(404, "This user have not uploaded any videos ye");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          videos,
          "videos of the provided channel is fetched successfully"
        )
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

//total Upload Video
const getChannelVideosOur = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      throw new ApiError(400, "user not found");
    }
    const videos = await Video.aggregate([
      {
        $match: { owner: user._id },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "liked",
        },
      },
      {
        $addFields: {
          likes: { $size: "$liked" },
        },
      },
      {
        $project: {
          owner: user.username,
          title: 1,
          description: 1,
          likes: 1,
          thumbnail: 1,
        },
      },
    ]);
    if (!videos) {
      throw new ApiError(400, "Something Went wrong");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, videos, "Your channels videos found successfully")
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

export { getChannelStats, getChannelVideos, getChannelVideosOur };

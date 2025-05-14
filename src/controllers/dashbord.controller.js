import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
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
        new ApiResponce(
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

// Get channel videos by username anyone
const getChannelVideos = asyncHandler(async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      throw new ApiError(400, "Username is missing");
    }

    const user = await User.findOne({ username });

    if (!user) {
      throw new ApiError(404, "Channel not found");
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
          likes: { $size: "$liked" },
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          thumbnail: 1,
          likes: 1,
          createdAt: 1,
        },
      },
    ]);

    if (videos.length === 0) {
      throw new ApiError(404, "This user has not uploaded any videos yet");
    }

    return res
      .status(200)
      .json(
        new ApiResponce(200, videos, "Channel videos fetched successfully")
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

//total Upload Videos in our channel
const getChannelVideosOur = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user._id) {
      throw new ApiError(400, "User not found in request");
    }

    const videos = await Video.aggregate([
      {
        $match: { owner: new mongoose.Types.ObjectId(user._id) },
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
          title: 1,
          description: 1,
          thumbnail: 1,
          likes: 1,
          createdAt: 1,
        },
      },
    ]);

    if (videos.length === 0) {
      throw new ApiError(404, "You haven't uploaded any videos yet");
    }

    return res
      .status(200)
      .json(
        new ApiResponce(
          200,
          videos,
          "Your channel's videos fetched successfully"
        )
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

export { getChannelStats, getChannelVideos, getChannelVideosOur };

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.Model.js";

// Toggle Video Like
const toggleVideolike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide Video ID");
  }
  const ifLike = await Like.findOne({ video: videoId, likedBy: req.user._id });

  if (!ifLike) {
    try {
      await Like.create({
        video: videoId,
        likedBy: req.user._id,
      });

      return res.json(new ApiResponce("Video liked successfully"));
    } catch (error) {
      throw new ApiError(500, "something went wrong while adding your like");
    }
  } else {
    try {
      await Like.deleteOne({ video: videoId, likedBy: req.user._id });

      return res
        .status(200)
        .json(new ApiResponce(200, "unliked", "like remove"));
    } catch (error) {
      throw new ApiError(
        500,
        "something went wrong when removing your like !!"
      );
    }
  }
});

// Toggle Comment Like
const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { CommentId } = req.params;

    if (!CommentId) {
      throw new ApiError(400, "give proper comment id");
    }
    // Check if the comment exists
    const ifCommentExist = await Comment.findById(CommentId);

    if (!ifCommentExist) {
      throw new ApiError(404, "The comment not found");
    }

    const ifLike = await Like.findOne({
      comment: CommentId,
      likedBy: req.user._id,
    });

    if (!ifLike) {
      try {
        await Like.create({
          comment: CommentId,
          likedBy: req.user._id,
        });
        return res
          .status(200)
          .json(new ApiResponce("Comment like Successfully"));
      } catch (error) {
        throw new ApiError(500, "something went wrong while adding your like");
      }
    } else {
      try {
        await Like.deleteOne({
          comment: CommentId,
          likedBy: req.user._id,
        });
        return res
          .status(200)
          .json(new ApiResponce(200, "unliked", "like remove"));
      } catch (error) {
        throw new ApiError(
          500,
          "something went wrong when removing your like !!"
        );
      }
    }
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

// Toggle Tweet Like
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(404, "provide tweet id");
  }

  const ifTweetExist = await Tweet.findById(tweetId);

  if (!ifTweetExist) {
    throw new ApiError(400, "Tweet not exist");
  }

  const tweet = await Like.findOne({ tweet: tweetId, likedBy: req.user._id });

  if (!tweet) {
    try {
      await Like.create({
        tweet: tweetId,
        likedBy: req.user._id,
      });
      return res.json(new ApiResponce("Tweet liked successfully"));
    } catch (error) {
      throw new ApiError(500, "something went wrong when adding your like");
    }
  } else {
    try {
      await Like.deleteOne({
        tweet: tweetId,
        likedBy: req.user._id,
      });

      return res
        .status(200)
        .json(new ApiResponce(200, "unliked", "like remove"));
    } catch (error) {
      throw new ApiError(
        500,
        "something went wrong when removing your like !!"
      );
    }
  }
});

// Toggle Videos Like
const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    const likedVideos = await Like.aggregate([
      {
        $match: { likedBy: new mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "video",
          as: "video",
        },
      },
      {
        $unwind: "$video",
      },
      {
        $lookup: {
          from: "users",
          localField: "video.owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      {
        $project: {
          title: "$video.title",
          thumbnail: "$video.thumbnail",
          videofile: "$video.videoFile",
          description: "$video.description",
          duration: "$video.duration",
          view: "$view.deuraction",
          owner: {
            fullName: "$owner.fullName",
            username: "$owner.uswename",
            avatar: "$owner.avatar",
          },
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponce(200, likedVideos, "liked videos fetched successfully")
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

export { toggleVideolike, toggleCommentLike, toggleTweetLike, getLikedVideos };

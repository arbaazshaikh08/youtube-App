import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";

// add Video Comment
const addComment = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    const { videoId } = req.params;

    if (!content || !videoId) {
      throw new ApiError(400, "provide both content and video id ");
    }

    const comment = await Comment.create({
      content,
      owner: req.user._id,
      video: videoId,
    });

    if (!comment) {
      throw new ApiError(
        500,
        "something went wrong when adding your comment in database"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "comment added successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// Update Video  Comment
const updateComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new ApiError(400, "Invalid comment ID");
    }

    const owner = req.user?._id;

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { content, updatedAt: Date.now(), owner },
      { new: true }
    );
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    await comment.save();

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "comment updated successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// get comment from Video
const getVideoComments = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video ID");
    }

    const comments = await Comment.aggregate([
      {
        $match: { video: new mongoose.Types.ObjectId(videoId) },
      },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "owner",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      {
        $lookup: {
          from: "likes",
          foreignField: "comment",
          localField: "_id",
          as: "likes",
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          likesCount: 1,
          "owner.fullname": 1,
          "owner.username": 1,
          "owner.avatar": 1,
        },
      },
    ]);

    if (!comments || comments.length === 0) {
      throw new ApiError(404, "No comment found on this video");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, comments, "comments fetched successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// Delete a comment from Video
const deleteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!commentId) {
      throw new ApiError(404, " Provide Comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "comment not found");
    }

    const isDeleted = await Comment.findByIdAndDelete(commentId);

    if (!isDeleted) {
      throw new ApiError(
        500,
        "something went wrong when deleting your comment "
      );
    }

    await Like.deleteMany({ comment: commentId });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "comment is deleted successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


export { addComment, updateComment, getVideoComments, deleteComment };

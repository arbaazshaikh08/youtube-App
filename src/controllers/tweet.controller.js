import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.Model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";

// create Tweet
const createTweet = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      throw new ApiError((400, "provide the content"));
    }
    if (!isValidObjectId(userId)) {
      throw new ApiError(404, "Invalid user ID");
    }
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const tweet = await Tweet.create({
      content: content.trim(),
      owner: req.user._id,
    });
    if (!tweet) {
      throw new ApiError(500, "something went wrong when creating your tweet");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, tweet, "tweet made successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


//get User Tweet
const getUserTweets = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalied user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const tweets = await Tweet.find({ owner: userId });

    if (!tweets.length === 0) {
      throw new ApiError(400, "No tweets Founds");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, tweets, "tweets fetched successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// Update Tweet
const updatedTweet = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!tweetId || !isValidObjectId(tweetId)) {
      throw new ApiError(400, "provide proper tweet id");
    }
    if (!content) {
      throw new ApiError(400, "provide proper description");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new ApiError(404, "This tweet does not exist");
    }
    if (tweet.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(
        403,
        "You are not the owner of this tweet. Unable to edit"
      );
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
      { _id: tweetId },

      { $set: { content } },

      { new: true }
    );

    if (!updatedTweet) {
      throw new ApiError(500, "something went wrong when updating your tweet");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, updatedTweet, "tweet updated successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// Delete Twwet
const deleteTweet = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;

    if (!tweetId) {
      throw new ApiError(400, "provide proper tweet id");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new ApiError(404, "This tweet does not exist");
    }
    if (!tweet.owner.equals(req.user._id)) {
      throw new ApiError(
        403,
        "You are not the owner of this tweet unable to edit"
      );
    }
    const deleted = await Tweet.findByIdAndDelete(tweetId);
    if (!deleted) {
      throw new ApiError(500, "something went wrong when deleting your tweet");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Tweet successfully deleted"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


export { createTweet, getUserTweets, updatedTweet, deleteTweet };

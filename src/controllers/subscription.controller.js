import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Toggle Subscription
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Provide channel id");
  }

  const channelExist = await User.findById(channelId);

  if (!channelExist) {
    throw new ApiError(404, "provided id does not exist");
  }

  const isExist = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });
  
  if (!isExist) {
    try {
      await Subscription.create({
        subscriber: req.user._id,
        channel: channelId,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, "subscribed", "subscription added"));

    } catch (error) {
      throw new ApiError(
        500,
        "something went wrong when adding your subscription"
      );
    }
  } else {
    try {
      await Subscription.findByIdAndDelete(isExist._id);

      return res
        .status(200)
        .json(new ApiResponse(200, "subscription removed", "removed"));

    } catch (error) {
      throw new ApiError(
        500,
        "something went wrong when removing your subscription"
      );
    }
  }
});


// controller  return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!channelId || !mongoose.isValidObjectId(channelId)) {
      throw new ApiError(400, "Provide channel id");
    }
    const channelExist = await User.findById(channelId);

    if (!channelExist) {
      throw new ApiError(404, "provided id does not exist");
    }
    const subscribers = await Subscription.aggregate([
      {
        $match: { channel: new mongoose.Types.ObjectId(channelId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriber",
        },
      },
      {
        $unwind: "$subscriber",
      },
      {
        $project: {
          "subscriber._id": 1,
          "subscriber.username": 1,
          "subscriber.avatar": 1,
        },
      },
    ]);
    // console.log('Subscribers:', subscribers);
    if (!subscribers.length) {
      throw new ApiError(404, "This channel have no subscribers yet");
    }

    const info = {
      subscribers: subscribers || [],
      totalSubscribers: subscribers.length || 0,
    };
    return res
      .status(200)
      .json(new ApiResponse(200, info, "subscribers fetched successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// controller  return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  try {
    const { SubscriberId } = req.params;

    if (!SubscriberId || !mongoose.isValidObjectId(SubscriberId)) {
      throw new ApiError(400, "provide subscriber id");
    }

    const user = await User.findById(SubscriberId);
    if (!user) {
      throw new ApiError(404, "subscriber not found");
    }
    const subscribedChannel = await Subscription.aggregate([
      { $match: { subscriber: new mongoose.Types.ObjectId(SubscriberId) } },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channel",
        },
      },
      { $unwind: "$channel" },
      {
        $project: {
          "subscriber._id": 1,
          "subscriber.username": 1,
          "subscriber.avatar": 1,
        },
      },
    ]);
    if (!subscribedChannel.length) {
      throw new ApiError(408, "the user have not subscribed to any channel");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribedChannel,
          "subscribed channel fetched successfully"
        )
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

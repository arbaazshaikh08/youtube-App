import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";


// Create a new playlist
const createPlaylist = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    const { ownerId } = req.params;

    if (!name || !description) {
      throw new ApiError(400, "Name and description are required");
    }

    if (!ownerId || !mongoose.isValidObjectId(ownerId)) {
      throw new ApiError(400, "Provide Proper ID");
    }
    const playlist = await Playlist.create({
      name,
      description,
      owner: ownerId,
    });

    if (!playlist) {
      throw new ApiError(
        500,
        "Something went wrong when creating your playlist"
      );
    }
    res
      .status(201)
      .json(new ApiResponse(201, playlist, "Playlist created  successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// Get all playlists owned by a specific user
const getUserPlaylists = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    // console.log(userId);

    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not Found");
    }

    const playlists = await Playlist.find({ owner: userId });

    if (!playlists || Playlist.length === 0) {
      throw new ApiError(404, "This user have not any playlist yet");
    }

    res
      .status(200)
      .json(new ApiResponse(200, playlists, "Playlist fetched successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// Get a playlist by its ID
const getPlaylistById = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;

    if (!playlistId || !isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "Playlist is not Found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, playlist, "PlayList fetched successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// Add a video to a playlist
const addVideotoPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    // validate Platlist id
    if (!playlistId || !mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, " Invalid playlist Id");
    }

    // validate video id
    if (!videoId || !mongoose.isValidObjectId(videoId)) {
      throw new ApiError(404, "Invalid video id ");
    }

    // Check if the video exists
    const videoExit = await Video.findById(videoId);

    if (!videoExit) {
      throw new ApiError(404, "The video does not exist");
    }

    // Check if the playlist exists
    const playlistexist = await Playlist.findById(playlistId);

    if (!playlistexist) {
      throw new ApiError(404, "playlist does not exist");
    }

    // Check for ownership permission
    if (playlistexist?.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(
        403,
        "You do not have permission to add videos to this playlist"
      );
    }

    // Check if the video is already in the playlist
    if (playlistexist.videos.includes(videoId)) {
      throw new ApiError(409, "This video is already in this playlist");
    }

    // Add the video to the playlist

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $addToSet: { videos: videoId },
      },
      { new: true }
    );

    if (!updatedPlaylist) {
      throw new ApiError(
        500,
        "Something went wrong when adding your video to the playlist"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedPlaylist,
          "Video added to playlist successfully"
        )
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// Remove a video from a playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "invaliduaser ID");
    }
    if (!mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid video ID");
    }

    // Check video exists
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
      throw new ApiError(404, "The videodoes not exist");
    }

    // Check  playlist exists
    const playlistExits = await Playlist.findById(playlistId);
    if (!playlistExits) {
      throw new ApiError(404, "Playlist does not exist");
    }

    // Check owner
    if (playlistExits.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(
        403,
        "You do nothave permission to remove video fromthis playlist"
      );
    }

    // Check video is in the playlist
    if (!playlistExits.videos.includes(videoId)) {
      throw new ApiError(
        404,
        "The video you want to remove is notpresent in the playlist"
      );
    }

    // Remove  video from playlist
    const updatePlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: { videos: videoId },
      },
      { new: true }
    );

    if (!updatePlaylist) {
      throw new ApiError(
        500,
        "Something went wrong when removing the video from the playlist"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatePlaylist, "Video removed"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// Add the video to the playlist
const updatePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { name, decription } = req.body;

    // Validate playlist ID
    if (!playlistId || !mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID");
    }

    // Ensure at least one field is provided for update

    if (!name && !decription) {
      throw new ApiError(400, "At least provide name or description");
    }

    // Find the playlist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(
        403,
        "You do not have permission to update this playlist"
      );
    }
    // Update the playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $set: {
          name: name || playlist.name,
          decription: decription || playlist.decription,
        },
      },
      { new: true }
    );

    if (!updatedPlaylist) {
      throw new ApiError(
        500,
        "Something went wrong when updating the playlist"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedPlaylist, "The playlist has been updated")
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


// Delete a Video from Playlist
const deletePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;

    // Validate playlist ID
    if (!playlistId || !mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID");
    }

    // Check if the playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "playlist not found");
    }

    // Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(
        403,
        "You are not the owner of the playlist; can't delete"
      );
    }

    // Delete the playlist
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if (!deletedPlaylist) {
      throw new ApiError(
        500,
        "Something went wrong when deleting the playlist"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully")
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});


export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideotoPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

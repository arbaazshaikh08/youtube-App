import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideotoPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/create-playlist/:ownerId").post(verifyJWT, createPlaylist);

router.route("/get-playlist-by-id/:playlistId").get(verifyJWT, getPlaylistById);

router
  .route("/add-v-to-playlist/:playlistId/videos/:videoId")
  .post(verifyJWT, addVideotoPlaylist);

router.route("/get-user-palylist/:userId").post(verifyJWT, getUserPlaylists);

router
  .route("/remove-video/:playlistId/videos/:videoId")
  .post(verifyJWT, removeVideoFromPlaylist);

router.route("/update/:playlistId").post(verifyJWT, updatePlaylist);

router.route("/delete/:playlistId").delete(verifyJWT, deletePlaylist);

export default router;

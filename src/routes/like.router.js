import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideolike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/toggle-like/:videoId").post(verifyJWT, toggleVideolike);
router.route("/comment-like/:CommentId").post(verifyJWT, toggleCommentLike);
router.route("/tweet-like/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/likedVideos").get(verifyJWT, getLikedVideos);

export default router;


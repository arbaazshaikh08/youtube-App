import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getChannelStats,
  getChannelVideos,
  getChannelVideosOur,
} from "../controllers/dashbord.controller.js";

const router = Router();

router.route("/stats").get(verifyJWT, getChannelStats);
router.route("/videos/:username").get(verifyJWT, getChannelVideos);
router.route("/get-videos/:username").post(verifyJWT, getChannelVideosOur);

export default router;

import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();
router.route("/subcribe/:channelId").post(verifyJWT, toggleSubscription);
router
  .route("/subscriber/:channelId")
  .get(verifyJWT, getUserChannelSubscribers);
router
  .route("/subcribe-user/:SubscriberId")
  .get(verifyJWT, getSubscribedChannels);

export default router;

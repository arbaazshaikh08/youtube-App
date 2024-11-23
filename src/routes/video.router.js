import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllvideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updatedVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
 
const router = Router();

router.route("/publish-video").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  publishAVideo
);
router.route("/getAll-videos").get(verifyJWT, getAllvideos);
router.route("/get-videoBy-Id/:videoId").get(verifyJWT, getVideoById);
router.route("/update/:videoId").patch(verifyJWT, updatedVideo);
router.route("/delete/:videoId").delete(verifyJWT, deleteVideo);
router.route("/toggle-publish/:videoId").put(verifyJWT, togglePublishStatus);

export default router;

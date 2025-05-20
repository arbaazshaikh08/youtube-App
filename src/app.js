import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


app.get("/", (req, res) => {
  res.send("Server is live ✅");
});
// routes import

import userRouter from "./routes/user.router.js";
import playlistRouter from "./routes/playlist.router.js";
import videoRouter from "./routes/video.router.js";
import likeRouter from "./routes/like.router.js";
import commentRouter from "./routes/comment.router.js";
import dashboardRouter from "./routes/dashbore.router.js";
import tweetRouter from "./routes/tweet.router.js";
import subscriptionRouter from "./routes/subscriction.router.js";

// routes decleration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/dashbord", dashboardRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/subscrition", subscriptionRouter);

export { app };

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// --- Route Imports ---
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";

const app = express();

// --- Global Middlewares ---

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Standardize data limits to prevent large payload attacks
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // To serve temporary local files if needed
app.use(cookieParser());

// --- Basic Status Route ---
app.get("/", (req, res) => {
    res.send("API is live and running 🚀");
});

// --- Routes Declaration ---

// Mount the healthcheck first for monitoring tools
app.use("/api/v1/healthcheck", healthcheckRouter);

// Functional Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/dashboard", dashboardRouter);

// Standard URL Example: http://localhost:8000/api/v1/users/register

export { app };
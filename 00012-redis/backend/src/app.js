import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFound } from "./middleware/notFound.middleware.js";
import routes from "./routes/index.routes.js";
import postRoutes from "./routes/post.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.isProduction ? "combined" : "dev"));
app.use("/api/v1", routes);
app.use("/api/posts", postRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;

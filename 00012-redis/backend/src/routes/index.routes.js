import { Router } from "express";
import authRoutes from "./auth.routes.js";

/** Root API router mounted at `/api/v1`. */
const router = Router();

router.use("/auth", authRoutes);

export default router;

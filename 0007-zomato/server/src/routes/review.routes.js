const express = require("express");
const { createReview } = require("../controllers/review.controller");
const { authUser, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authUser, authorize("customer"), createReview);

module.exports = router;

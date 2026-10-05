const express = require("express");
const { createOrder, getMyOrders, updateOrderStatus } = require("../controllers/order.controller");
const { authUser, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authUser, authorize("customer"), createOrder);
router.get("/my", authUser, authorize("customer"), getMyOrders);
router.patch("/:id/status", authUser, authorize("owner"), updateOrderStatus);

module.exports = router;

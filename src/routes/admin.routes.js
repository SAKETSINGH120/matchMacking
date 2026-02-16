const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/admin");
const asyncHandler = require("../utils/asyncHandler");

router.post("/signup", asyncHandler(adminController.signup));
router.post("/login", asyncHandler(adminController.login));

module.exports = router;

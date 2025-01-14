const express = require("express");
const router = express.Router();
const controller = require("../../controllers/profile.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { uploadBuffer } = require("../../utils/multer");

router.route("/:username").get(controller.profile);
router.route("/").get(authenticate, controller.profile);
router.route("/image").put(uploadBuffer.any(), authenticate, controller.profileImage);
router.route("/update").patch(authenticate, controller.profileUpdate);
module.exports = router;

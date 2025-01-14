const router = require("express").Router();
const { uploadBuffer } = require("../../utils/multer");
const { authenticate, authorize } = require("../../middlewares/auth.middleware.js");
const controller = require("../../controllers/siteSetting.controller");

router.route("/details").get(controller.findOneData);
router.route("/update").put(
  uploadBuffer.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  authenticate,
  authorize(["admin"]),
  controller.edit
);

module.exports = router;

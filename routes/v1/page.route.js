const express = require("express");
const router = express.Router();
const { uploadBuffer } = require("../../utils/multer");
const controller = require("../../controllers/page.controller");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");

router.route("/list").get(controller.findAllData);
router.route("/details").get(controller.details);
router.route("/add").post(uploadBuffer.any(), authenticate, authorize(["admin"]), controller.manage);
router.route("/edit").put(uploadBuffer.any(), authenticate, authorize(["admin"]), controller.manage);
router.route("/status-change").patch(authenticate, authorize(["admin"]), controller.statusChange);
router.route("/delete").patch(authenticate, authorize(["admin"]), controller.deleteData);

module.exports = router;

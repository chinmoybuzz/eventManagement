const express = require("express");
const router = express.Router();
const { uploadBuffer } = require("../../utils/multer");
const controller = require("../../controllers/service.controller");
const { authenticate, authorize, guest } = require("../../middlewares/auth.middleware");

router.route("/add").post(uploadBuffer.any(),authorize(["admin"]), authenticate, controller.manage);
router.route("/list").get(guest, controller.findAllData);
router.route("/categories").get(guest, controller.categoriesGroup);
router.route("/details/:id").get(guest, controller.findOneData);
router.route("/edit/:id").put(uploadBuffer.any(),authorize(["admin"]), authenticate, controller.manage);
router.route("/status-change").patch(authenticate, controller.changeStatus);
router.route("/featured-change").patch(authenticate, authorize(["admin"]), controller.changeFeatured);
router.route("/ordering").patch(authenticate, authorize(["admin"]), controller.saveOrdering);
router.route("/delete").patch(authenticate, authorize(["admin"]), controller.remove);
router.route("/delete-file").patch(authenticate, authorize(["admin"]), controller.deleteFileFromArray);

module.exports = router;

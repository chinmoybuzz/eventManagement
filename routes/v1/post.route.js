const express = require("express");
const router = express.Router();
const { uploadBuffer } = require("../../utils/multer");
const controller = require("../../controllers/post.controller");

const { authenticate, authorize, guest } = require("../../middlewares/auth.middleware");

router.route("/list").get(guest, controller.findAllData);
router.route("/details/:id").get(controller.findOneData);
router.route("/authors").get(controller.authors);
router.route("/add").post(uploadBuffer.any(), authenticate, controller.manage);
router.route("/edit").put(uploadBuffer.any(), authenticate, controller.manage);
router.route("/status-change").patch(authenticate, authorize(["admin"]), controller.statusChange);
router.route("/featured-change").patch(authenticate, authorize(["admin"]), controller.changeFeatured);
router.route("/delete").patch(authenticate, authorize(["admin"]), controller.deleteData);
router.route("/ordering").patch(authenticate, authorize(["admin"]), controller.saveOrdering);
router.route("/manage-favorite").patch(authenticate, controller.manageFavorite);
router.route("/delete-file").patch(authenticate, authorize(["admin"]), controller.deleteFileFromArray);
module.exports = router;

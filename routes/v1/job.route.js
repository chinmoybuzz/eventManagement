const express = require("express");
const router = express.Router();
const { uploadBuffer } = require("../../utils/multer");
const controller = require("../../controllers/job.controller");
const { authenticate, authorize, guest } = require("../../middlewares/auth.middleware");

router.route("/list").get(guest, controller.findAllData);
router.route("/details/:id").get(guest, controller.findOneData);
router.route("/add").post(uploadBuffer.single("image"), authenticate, authorize(["admin"]), controller.manage);
router.route("/edit/:id").put(uploadBuffer.single("image"), authenticate, authorize(["admin"]), controller.manage);
router.route("/status-change").patch(authenticate, authorize(["admin"]), controller.statusChange);
router.route("/featured-change").patch(authenticate, authorize(["admin"]), controller.changeFeatured);
router.route("/delete").patch(authenticate, authorize(["admin"]), controller.deleteData);
router.route("/ordering").patch(authenticate, authorize(["admin"]), controller.jobOrdering);
router.route("/manage-favorite").put(authenticate, controller.manageFavorite);

router.route("/applications").get(authenticate, controller.applicationList);
router.route("/applications/:id").get(authenticate, controller.aplicantdetails);
router.route("/apply").post(uploadBuffer.single("jobAplicant[cvFile]"), authenticate, controller.apply);
router.route("/change-application-status").patch(authenticate, controller.changeApplicationStatus);

module.exports = router;

const express = require("express");
const router = express.Router();
const { uploadBuffer } = require("../../utils/multer");
const controller = require("../../controllers/user.controller");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { checkPlan } = require("../../middlewares/checkPlan.middleware");

router.route("/list").get(controller.findAllData);
router.route("/details/:id").get(authenticate, controller.findOneData);
router.route("/add").post(uploadBuffer.any(), authenticate, authorize(["admin"]), controller.manage);
router.route("/edit").put(uploadBuffer.any(), authenticate, authorize(["admin"]), controller.manage);
router.route("/ordering").patch(authenticate, authorize(["admin"]), controller.saveOrdering);
router.route("/status-change").patch(authenticate, authorize(["admin"]), controller.changeStatus);
router.route("/featured-change").patch(authenticate, authorize(["admin"]), controller.changeFeatured);
router.route("/delete").patch(authenticate, authorize(["admin"]), controller.remove);
router.route("/delete-file").patch(authenticate, authorize(["admin"]), controller.deleteFileFromArray);
router.route("/delete-social").patch(authenticate, authorize(["admin"]), controller.deleteSocial);
router.route("/username").patch(controller.username);
router.route("/portfolio-image-status-change").patch(authenticate, controller.portfolioImageStatusChange);
router.route("/portfolio-image-ordering").patch(authenticate, controller.portfolioImageOrdering);
router.route("/manage-favorite").patch(authenticate, controller.manageFavorite);

module.exports = router;

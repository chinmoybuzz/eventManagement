const express = require("express");
const router = express.Router();
const controller = require("../../controllers/review.controller");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");

router.route("/list").get(controller.findAllData);
router.route("/details/:id").get(authenticate, controller.findOneData);
router.route("/").get(controller.review);
router.route("/add").post(authenticate, controller.manage);
router.route("/edit").put(authenticate, controller.manage);
router.route("/status-change").patch(authenticate, authorize(["admin"]), controller.statusChange);
router.route("/delete").patch(authenticate, authorize(["admin"]), controller.remove);
router.route("/ordering").patch(authenticate, authorize(["admin"]), controller.saveOrdering);

module.exports = router;

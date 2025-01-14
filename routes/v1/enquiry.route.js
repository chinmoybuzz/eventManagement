const express = require("express");
const router = express.Router();
const controller = require("../../controllers/enquiry.controller");
const { authenticate } = require("../../middlewares/auth.middleware");

router.route("/add").post(authenticate, controller.manage);
router.route("/list").get(authenticate, controller.findAllData);
router.route("/details/:id").get(authenticate, controller.findOneData);
router.route("/edit").patch(authenticate, controller.manage);
router.route("/delete").patch(authenticate, controller.remove);
router.route("/status-change").patch(authenticate, controller.changeStatus);

module.exports = router;

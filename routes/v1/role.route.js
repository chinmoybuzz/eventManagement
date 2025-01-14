const express = require("express");
const router = express.Router();
const controller = require("../../controllers/role.controller");

const { authenticate } = require("../../middlewares/auth.middleware");

router.route("/list").get(controller.findAllData);
router.route("/add").post(authenticate, controller.manage);
router.route("/edit").patch(authenticate, controller.manage);
router.route("/delete").patch(authenticate, controller.remove);

module.exports = router;

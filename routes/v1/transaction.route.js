const express = require("express");
const router = express.Router();
const { uploadBuffer } = require("../../utils/multer");
const controller = require("../../controllers/transaction.controller");
const { authenticate, authorize, guest } = require("../../middlewares/auth.middleware");

router.route("/list").get(guest, controller.findAllData);
router.route("/details/:id").get(guest, controller.findOneData);
router.route("/add").post(authenticate, authorize(["admin"]), controller.manage);
router.route("/edit").put(authenticate, authorize(["admin"]), controller.manage);
router.route("/delete").patch(authenticate, authorize(["admin"]), controller.remove);
router.route("/ordering").patch(authenticate, authorize(["admin"]), controller.saveOrdering);
router.route("/status-change").patch(authenticate, authorize(["admin"]), controller.statusChange);

module.exports = router;

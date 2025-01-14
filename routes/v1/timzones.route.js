const express = require("express");
const router = express.Router();
const controller = require("../../controllers/timezone.controller");

const {
  guest,
} = require("../../middlewares/auth.middleware");

router.route("/list").get(guest, controller.findAllData);
router.route("/details/:id").get(guest, controller.details)

module.exports = router;

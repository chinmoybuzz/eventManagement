const router = require("express").Router();
const controller = require("../../controllers/dashboard.controller");
const { authenticate } = require("../../middlewares/auth.middleware");

router.route("/details").get(authenticate, controller.details);

module.exports = router;

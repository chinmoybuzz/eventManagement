const router = require("express").Router();
const controller = require("../../controllers/eventypes.controller");
const { authenticate, authorize, guest } = require("../../middlewares/auth.middleware");

router.route("/list").get(guest, controller.findAllData);
router.route("/details/:id").get(authenticate, authorize(["admin"]), controller.details);
router.route("/ordering").patch(authenticate, authorize(["admin"]), controller.saveOrdering);
// router.route("/add").post(authenticate, authorize(["admin"]), controller.manage);
module.exports = router;

const router = require("express").Router();
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const controller = require("../../controllers/faq.controller");

router.route("/list").get(authenticate, controller.findAllData);
router.route("/details/:id").get(authenticate, controller.findOneData);
router.route("/add").post(authenticate, authorize(["admin", "user", "vendor"]), controller.manage);
router.route("/edit").put(authenticate, authorize(["admin", "user", "vendor"]), controller.manage);
router.route("/answer").patch(authenticate, authorize(["admin", "user", "vendor"]), controller.answer);
router.route("/helpful-unhelpful").patch(authenticate, authorize(["admin", "user", "vendor"]), controller.helpfulUnhelpful);
router.route("/status-change").patch(authenticate, authorize(["admin"]), controller.statusChange);
router.route("/delete").patch(authenticate, authorize(["admin"]), controller.remove);
router.route("/ordering").patch(authenticate, authorize(["admin"]), controller.saveOrdering);

module.exports = router;

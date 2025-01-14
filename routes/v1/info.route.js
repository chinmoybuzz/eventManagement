const router = require("express").Router();
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const controller = require("../../controllers/info.controller");

router.route("/").get(controller.findAllData);
router.route("/:id").get(authenticate, controller.findOneData);
router.route("/add").post(authenticate, authorize(["admin"]), controller.manage);
router.route("/edit").put(authenticate, authorize(["admin"]), controller.manage);
router.route("/status-change").patch(authenticate, authorize(["admin"]), controller.statusChange);
router.route("/delete").patch(authenticate, authorize(["admin"]), controller.remove);
router.route("/ordering").patch(authenticate, authorize(["admin"]), controller.saveOrdering);
router.route("/card-ordering").patch(authenticate, authorize(["admin"]), controller.saveCardsOrdering);
router.route("/button-ordering").patch(authenticate, authorize(["admin"]), controller.saveButtonOrdering);

module.exports = router;

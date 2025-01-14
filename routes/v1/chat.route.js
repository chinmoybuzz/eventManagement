const router = require("express").Router();
const controllers = require("../../controllers/chat.controller");
const { authenticate } = require("../../middlewares/auth.middleware");

router.route("/edit").put(authenticate, controllers.manage);
router.route("/add").post(authenticate, controllers.manage);
router.route("/").get(authenticate, controllers.findAllData);
router.route("/:id").get(authenticate, controllers.findOneData);
router.route("/delete").patch(authenticate, controllers.remove);
router.route("/ordering").patch(authenticate, controllers.saveOrdering);
router.route("/status-change").patch(authenticate, controllers.statusChange);

module.exports = router;

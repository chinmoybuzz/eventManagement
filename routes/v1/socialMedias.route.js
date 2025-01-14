const router = require("express").Router();
const controllers = require("../../controllers/socialMedias.controller");

router.route("/").get(controllers.findAllData);
router.route("/:id").get(controllers.findOneData);
router.route("/add").post(controllers.manage);
router.route("/edit").put(controllers.manage);
router.route("/status-change").patch(controllers.statusChange);
router.route("/delete").patch(controllers.remove);
router.route("/ordering").patch(controllers.saveOrdering);

module.exports = router;

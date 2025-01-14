const router = require("express").Router();
const { uploadBuffer } = require("../../utils/multer");
const controllers = require("../../controllers/category.controller");
const { authenticate, authorize, guest } = require("../../middlewares/auth.middleware");

router.route("/list").get(guest, controllers.findAllData);
router.route("/details/:id").get(guest, controllers.findOneData);
router.route("/add").post(uploadBuffer.single("image"), authenticate, authorize(["admin"]), controllers.manage);
router.route("/edit").put(uploadBuffer.single("image"), authenticate, authorize(["admin"]), controllers.manage);
router.route("/status-change").patch(authenticate, authorize(["admin"]), controllers.statusChange);
router.route("/delete").patch(authenticate, authorize(["admin"]), controllers.remove);
router.route("/ordering").patch(authenticate, authorize(["admin"]), controllers.saveOrdering);

module.exports = router;

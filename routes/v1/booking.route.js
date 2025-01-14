const router = require("express").Router();
const { uploadWithoutImage } = require("../../utils/multer");
const controller = require("../../controllers/booking.controller");
const { authenticate, authorize, guest } = require("../../middlewares/auth.middleware");

router.route("/list").get(guest, controller.findAllData);
router.route("/details/:id").get(authenticate, controller.findOneData);
router.route("/add").post(uploadWithoutImage, authenticate, controller.manage);
router.route("/edit").put(uploadWithoutImage, authenticate, controller.manage);
router.route("/delete").patch(authenticate, controller.remove);
router.route("/ordering").patch(authenticate, controller.saveOrdering);
router.route("/status-change").patch(authenticate, controller.statusChange);

module.exports = router;

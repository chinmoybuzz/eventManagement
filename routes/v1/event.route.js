const router = require("express").Router();
const { uploadBuffer } = require("../../utils/multer");
const controller = require("../../controllers/event.controller");
const { authenticate, authorize, guest } = require("../../middlewares/auth.middleware");

router.route("/list").get(guest, controller.findAllData);
router.route("/details/:id").get(guest, controller.details);
router.route("/add").post(uploadBuffer.any(), authenticate, authorize(["admin"]), controller.addData);
router.route("/edit").put(uploadBuffer.any(), authenticate, authorize(["admin"]), controller.updateData);
router.route("/status-change").patch(authenticate, authorize(["admin"]), controller.statusChange);
router.route("/delete").patch(authenticate, authorize(["admin"]), controller.deleteData);
router.route("/ordering").patch(authenticate, authorize(["admin"]), controller.saveOrdering);
router.route("/enroll").put(authenticate, controller.enroll);
router.route("/manage-favorite").put(authenticate, controller.manageFavorite);
router.route("/recomended-list").get(guest, controller.recomendedList);

module.exports = router;

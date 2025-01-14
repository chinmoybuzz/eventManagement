const router = require("express").Router();
const { uploadWithoutImage } = require("../../utils/multer");
const controller = require("../../controllers/emailTemplate.controller");
const { authenticate, authorize, guest } = require("../../middlewares/auth.middleware");

router.route("/list").get(guest, controller.findAllData);
router.route("/details").get(guest, controller.details);
router.post("/add", authenticate, authorize(["admin"]), controller.manage);
router.route("/edit").put(uploadWithoutImage, authenticate, authorize(["admin"]), controller.manage);

module.exports = router;

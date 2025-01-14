const router = require("express").Router();
const controller = require("../../controllers/country.controller");

router.route("/").get(controller.findAllData);
router.route("/:id").get(controller.findOneData);

module.exports = router;

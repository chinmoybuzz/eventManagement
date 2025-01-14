const router = require("express").Router();
const controller = require("../../controllers/city.controller");

router.route("/").get(controller.findAllData);
module.exports = router;

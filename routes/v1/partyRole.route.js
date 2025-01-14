const express = require("express");
const partyRoleRouter = express.Router();
// const { uploadWithoutImage } = require("../../utils/multer");
const controller = require("../../controllers/partyRole.controller");

const {
  authenticate,
  authorize,
  guest,
} = require("../../middlewares/auth.middleware");

partyRoleRouter.route("/list").get(guest, controller.findAllData);

partyRoleRouter
  .route("/details/:id")
  .get(authenticate, authorize(["admin"]), controller.details);

partyRoleRouter
  .route("/add")
  .post(authenticate, authorize(["admin"]), controller.manage);

partyRoleRouter
  .route("/edit")
  .put(authenticate, authorize(["admin"]), controller.manage);

partyRoleRouter
  .route("/delete")
  .patch(authenticate, authorize(["admin"]), controller.deleteAll);

partyRoleRouter
  .route("/ordering")
  .patch(authenticate, authorize(["admin"]), controller.saveOrdering);

partyRoleRouter.patch(
  "/status-change",
  authenticate,
  authorize(["admin"]),
  controller.statusChange
);
module.exports = partyRoleRouter;

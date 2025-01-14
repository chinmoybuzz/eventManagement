const express = require("express");
const planRouter = express.Router();
const { uploadWithoutImage } = require("../../utils/multer");
const controller = require("../../controllers/plan.controller");

const { authenticate, authorize, guest } = require("../../middlewares/auth.middleware");

planRouter.route("/list").get(guest, controller.findAllData);
planRouter.route("/details/:id").get(guest, controller.details);
planRouter.route("/add").post(uploadWithoutImage, authenticate, authorize(["admin"]), controller.manage);
planRouter.route("/edit").put(uploadWithoutImage, authenticate, authorize(["admin"]), controller.manage);
planRouter.route("/status-change").patch(authenticate, authorize(["admin"]), controller.statusChange);
planRouter.route("/delete").patch(authenticate, authorize(["admin"]), controller.deleteData);
planRouter.route("/ordering").patch(authenticate, authorize(["admin"]), controller.saveOrdering);
planRouter.route("/subscribe").post(uploadWithoutImage, authenticate, controller.subscribe);
planRouter.route("/subscribe/list").get(authenticate, controller.subscribeList);

planRouter.route("/stripe-webhook").post(controller.stripeWebhook);
module.exports = planRouter;

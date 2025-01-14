const express = require("express");
const jobType = express.Router();
const { uploadWithoutImage } = require("../../utils/multer");
const { findAllData, manage, deleteData, statusChange, saveOrdering, details } = require("../../controllers/jobType.controller");

const { authenticate, authorize } = require("../../middlewares/auth.middleware");

jobType.route("/list").get(findAllData);

jobType.route("/details/:id").get(details);

jobType.route("/add").post(uploadWithoutImage, authenticate, authorize(["admin"]), manage);

jobType.route("/edit").put(uploadWithoutImage, authenticate, authorize(["admin"]), manage);

jobType.route("/status-change").patch(authenticate, authorize(["admin"]), statusChange);

jobType.route("/delete").patch(authenticate, authorize(["admin"]), deleteData);

jobType.route("/ordering").patch(authenticate, authorize(["admin"]), saveOrdering);

module.exports = jobType;

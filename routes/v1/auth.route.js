const router = require("express").Router();
const passport = require("passport");
const { authenticate } = require("../../middlewares/auth.middleware");
const controller = require("../../controllers/auth.controller");
const { uploadWithoutImage } = require("../../utils/multer");
const { checkPlan } = require("../../middlewares/checkPlan.middleware");

router.route("/login").post(uploadWithoutImage, controller.login);
router.route("/user-login").post(uploadWithoutImage, controller.userLogin);
router.route("/verify-token").post(uploadWithoutImage, authenticate, controller.verifyToken);
router.route("/refreshToken").post(uploadWithoutImage, controller.refreshToken);
router.route("/signup").post(uploadWithoutImage, controller.signup);
router.route("/send-otp").post(uploadWithoutImage, controller.sendOtp);
router.route("/verify-otp").post(uploadWithoutImage, controller.verifyOtp);
router.route("/forgot-password").patch(uploadWithoutImage, authenticate, controller.forgotPassword);
router.route("/reset-password").patch(uploadWithoutImage, authenticate, controller.resetPassword);

router.get("/google", (req, res, next) => {
  passport.authenticate("google", { scope: ["profile", "email"], state: req.query.roleCode })(req, res, next);
});

router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), controller.googleLogin);

router.get("/facebook", (req, res, next) => {
  const scope = "email,public_profile";
  passport.authenticate("facebook", { scope, state: req.query.roleCode })(req, res, next);
});

router.get("/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), controller.fbLogin);

router.get("/check", authenticate, checkPlan({ code: "service" }), (req, res) => res.send({ status: 200, m: "yehh it's working" }));

module.exports = router;

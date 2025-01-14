const passport = require("passport");
const { TokenExpiredError } = require("jsonwebtoken");
const Model = require("../models/user.model.js");
const jwt = require("jsonwebtoken");

exports.authenticate = async (req, res, next) => {
  try {
    passport.authenticate("jwt", { session: true }, async (err, decoded, info) => {
      if ((info && info.expired) || info instanceof TokenExpiredError) {
        return res.status(401).send({
          status: 401,
          message: "Token expired, please try again.",
          tokenExpired: true,
        });
      }

      if (err) {
        return res.status(500).send({
          status: 400,
          message: err.message,
        });
      }

      if (!decoded) {
        return res.status(401).send({
          status: 400,
          message: "Invalid token, please try again.",
        });
      }
      res.locals.authenticatedUser = decoded;
      res.locals.authenticatedUserType = decoded.role;
      const user = res.locals.authenticatedUser;
      req.body.authUser = user;
      next();
    })(req, res, next);
  } catch (error) {
    return res.status(401).send({ status: 401, message: error.message });
  }
};

exports.guest = async (req, res, next) => {
  try {
    const headers = req.headers;

    if (headers["authorization"] && headers["authorization"].includes("Bearer")) {
      const token = headers["authorization"].split(" ")[1];

      const user = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const userDetails = await Model.findOne({
        email: user.email.toLowerCase(),
        deletedAt: null,
      }).select("fullname email phone roleCode");
      req.body.authUser = userDetails;
    }
    next();
  } catch (error) {
    next();
  }
};

exports.authorize = (authorizedTypes = []) => {
  authorizedTypes = authorizedTypes;
  return async (req, res, next) => {
    let isAuthorizedType = authorizedTypes.includes(res.locals.authenticatedUserType);
    if (isAuthorizedType) {
      let user = res.locals.authenticatedUser;
      const getData = await Model.findOne({
        email: res.locals.authenticatedUser.email,
        deleted_at: null,
      }).select("_id");
      user._id = getData?._id;
      req.body.authUser = user;
      res.locals.authenticatedUserId = getData?._id;
      return next();
    } else {
      return res.status(401).send({
        status: 401,
        message: "Authenticated user is not authorized.",
      });
    }
  };
};

exports.canAccess = (permissionRestrictions = []) => {
  return async (req, res, next) => {
    if (res.locals.authenticatedUserType) {
      const getUser = await Model.findOne({
        _id: res.locals.authenticatedUserId,
      }).select("permissions");
      function findNested(obj, key, value) {
        if (obj[key] === value) {
          return obj;
        }
      }
      const notallowed =
        Array.isArray(permissionRestrictions) &&
        permissionRestrictions.filter((it) => {
          let spl = it.split(".");
          let key = spl[0];
          let nested = findNested(getUser.permissions[key], spl[1], true);
          return nested === undefined;
        });
      if (Array.isArray(notallowed) && notallowed.length > 0) {
        return res.status(401).send({
          status: 401,
          message: "Permission is not given",
        });
      }
      next();
    }
  };
};

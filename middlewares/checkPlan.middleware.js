const { ObjectId } = require("mongoose").Types;
const errorHandler = require("../helper/errorHandler");
const Subscription = require("../models/subscription.model");

exports.checkPlan = (arguments) => {
  return async (req, res, next) => {
    try {
      if (req.body.authUser.role === "admin") return next();
      const subscription = await Subscription.aggregate([
        {
          $match: {
            userId: new ObjectId(req.body.authUser._id),
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
          },
        },
        {
          $lookup: {
            from: "plans",
            foreignField: "_id",
            localField: "planId",
            as: "plan",
            pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } }],
          },
        },
        { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
        { $project: { plan: 1, startDate: 1, endDate: 1 } },
      ]);

      if (subscription.length < 1) return res.send({ status: 400, message: "Please take a subscription plan first" });

      const requestedFeature = subscription[0].plan.features.filter((feature) => feature.code === arguments.code);

      if (requestedFeature.length < 1) {
        return res.send({ status: 400, message: "Feature isn't available in your subscription plan" });
      }
      const featureLimit = requestedFeature[0].space;

      const data = await require(`../models/${arguments.code}.model`).aggregate([
        { $match: { deleteAt: null, createdAt: { $gte: subscription[0].startDate } } },
      ]);

      const featureUsed = data.length;

      if (featureLimit <= featureUsed) {
        return res.send({ status: 400, message: "Your subscription plan has reached its limit" });
      }
      return next();
    } catch (error) {
      return errorHandler(error, arguments);
    }
  };
};

const errorHandler = require("../helper/errorHandler");
const { PlanDurationType, paymentType } = require("../helper/typeConfig");
const { search } = require("../helper/search");
const Plan = require("../models/plan.model");
const Subscription = require("../models/subscription.model");
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const { ObjectId } = require("mongoose").Types;
const { convertFieldsToAggregateObject } = require("../helper/index");

exports.subscribePlan = async (params) => {
  try {
    const { userId, planId, authUser } = params;

    if (!userId) params.userId = authUser._id;
    if (!params.startDate) params.startDate = new Date();

    const checkPlan = await Plan.findById({ _id: planId });
    if (!checkPlan) return { status: 404, message: "Plan not found" };

    let endDate = new Date(params.startDate);

    switch (checkPlan.interval) {
      case PlanDurationType[1]:
        params.endDate = new Date(endDate.setDate(endDate.getDate() + checkPlan.duration));
        break;

      case PlanDurationType[2]:
        params.endDate = new Date(endDate.setDate(endDate.getDate() + checkPlan.duration * 7));
        break;

      case PlanDurationType[3]:
        params.endDate = new Date(endDate.setMonth(endDate.getMonth() + checkPlan.duration));
        break;

      case PlanDurationType[4]:
        params.endDate = new Date(endDate.setFullYear(endDate.getFullYear() + checkPlan.duration));
        break;

      default:
        params.endDate = new Date(endDate);
    }

    const data = await new Subscription({ ...params, endDate, createdBy: authUser._id }).save();

    await new Transaction({ userId, planId, amount: checkPlan.price, subscriptionId: data._id }).save();

    const user = await User.findById({ _id: params.userId });

    if (user && user.referral.referredBy) {
      await new Transaction({
        userId: user.referral.referredBy,
        amount: (checkPlan.price * user.referral.commission) / 100,
        paymentType: paymentType[1],
      }).save();
    }

    return { status: 200, message: "Congratulations you have successfully subscribed", data };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.subscribeList = async (params) => {
  try {
    const {
      _id,
      venderId,
      offset = 0,
      limit = 10,
      keyword,
      searchValue,
      selectValue = "user Plan subcriptionDetails  status createdAt",
      sortQuery = "-createdAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    let optionalQuery = { deleteAt: null };

    if (params.startDate && params.startDate != "null" && params.endDate && params.endDate != "null") {
      query.startDate = { $gte: new Date(params.startDate), $lte: new Date(params.endDate) };
    }

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      searchQuery.push("user.email", "user.fullname.firstName", "user.fullname.lastName", "Plan.name", "Plan.price");
      const includesPrice = searchQuery.includes("Plan.price");

      if (includesPrice) {
        if (!isNaN(keyword)) {
          optionalQuery["Plan.price"] = { $eq: parseInt(keyword) };
        } else {
          optionalQuery.$or = search(searchQuery, keyword);
        }
      }
    }

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    if (venderId) query["userId"] = new ObjectId(venderId);

    const myAggregate = Transaction.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "userId",
          as: "user",
          pipeline: [
            { $match: { $expr: { $eq: ["$deletedAt", null] } } },
            { $project: { fullname: { firstName: 1, lastName: 1 }, email: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "plans",
          foreignField: "_id",
          localField: "planId",
          as: "Plan",
          pipeline: [{ $match: { $expr: { $eq: ["$deletedAt", null] } } }, { $project: { name: 1, price: 1 } }],
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          foreignField: "_id",
          localField: "subscriptionId",
          as: "subcriptionDetails",
          pipeline: [{ $match: { $expr: { $eq: ["$deletedAt", null] } } }, { $project: { startDate: 1, endDate: 1 } }],
        },
      },
      {
        $set: {
          user: { $arrayElemAt: ["$user", 0] },
          Plan: { $arrayElemAt: ["$Plan", 0] },
          subcriptionDetails: { $arrayElemAt: ["$subcriptionDetails", 0] },
        },
      },
      { $project: selectProjectParams },
      { $match: optionalQuery },
    ]);

    const result = await Transaction.aggregatePaginate(myAggregate, { offset, limit, sort: sortQuery });

    return { status: 200, message: "List fetched successfully", ...result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

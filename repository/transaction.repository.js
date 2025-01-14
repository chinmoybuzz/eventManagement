const { convertFieldsToAggregateObject, aggregateFileConcat } = require("../helper/index.js");
const { ObjectId } = require("mongoose").Types;
const Model = require("../models/transaction.model.js");
const errorHandler = require("../helper/errorHandler.js");
const { search, statusSearch } = require("../helper/search.js");
const { isValidObjectId } = require("mongoose");

exports.manage = async (params) => {
  try {
    if (params.id) {
      const checkDataRes = await Model.findOne({ _id: params.id });
      if (!checkDataRes) return { status: 400, message: "Data not found" };
    }
    let newData;
    if (params.id) {
      newData = await Model.findByIdAndUpdate(params.id, {
        ...params,
        updatedBy: params.authUser ? params.authUser._id : null,
      });
    } else {
      const totalCount = await Model.find({ deletedAt: null }).countDocuments();
      newData = await Model.create({
        ...params,
        ordering: totalCount,
        createdBy: params.authUser ? params.authUser._id : null,
      });
    }
    const result = await this.findAllData({ _id: newData?._id });

    return {
      status: params.id ? 200 : 201,
      message: params.id ? "transaction updated successfully" : "transaction added successfully",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.findAllData = async (params) => {
  try {
    const {
      _id,
      code,
      status,
      userId,
      keyword,
      searchValue,
      offset = 0,
      limit = 10,
      selectValue = "amount planInfo transactionDate transactionInfo userDetails planDetails",
      sortQuery = "-createdAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    if (userId) query["userId"] = new ObjectId(userId);
    if (status) query["status"] = statusSearch(status);
    if (code) query["code"] = code.toLowerCase();
    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { fullname: 1, image: 1, email: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "planDetails",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { name: 1, price: 1 } },
          ],
        },
      },
      {
        $project: {
          ...selectProjectParams,
          userDetails: { $arrayElemAt: ["$userDetails", 0] },
          planDetails: { $arrayElemAt: ["$planDetails", 0] },
        },
      },
    ]);

    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });
    return { status: 200, message: "transaction list fetched successfully", ...result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.findOneData = async (params) => {
  try {
    let query = { deletedAt: null };
    if (isValidObjectId(params.id)) {
      query._id = params.id;
    } else query.slug = params.id;
    const result = await this.findAllData(query);
    if (result.docs.length == 0) return { status: 404, message: "transaction not found" };
    return {
      status: 200,
      message: "transaction data fetched successfully",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

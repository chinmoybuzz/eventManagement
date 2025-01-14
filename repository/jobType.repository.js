const { toArray, isNumber } = require("lodash");
const { search, statusSearch } = require("../helper/search.js");
const Model = require("../models/jobType.model.js");
const { ObjectId } = require("mongoose").Types;
const slugify = require("slugify");
const errorHandler = require("../helper/errorHandler");
const { convertFieldsToAggregateObject } = require("../helper/index.js");

exports.list = async (params) => {
  try {
    const {
      keyword,
      limit = 10,
      offset = 0,
      status,
      searchValue = false,
      selectValue = "title createdAt status",
      sortQuery = "ordering",
      _id = null,
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    if (status) query["status"] = statusSearch(status);

    if (keyword) {
      const searchQuery = searchValue
        ? searchValue.split(",")
        : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }
    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query._id = new ObjectId(_id);

    const myAggregate = Model.aggregate([
      { $match: query },
      { $project: { ...selectProjectParams } },
    ]);

    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });

    return { status: 200, message: "list fetch", result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.details = async (params) => {
  try {
    const data = await Model.findOne({ _id: params.id, deletedAt: null });

    if (!data) return { status: 404, message: "Job Type not found" };

    return { status: 200, message: "Data fetch successfull", data: data };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.manage = async (params) => {
  try {
    if (params.id) {
      const checkDataRes = await this.details({ id: params.id });
      if (checkDataRes.status != 200) return checkDataRes;
    }

    let newData;
    if (params.id) {
      newData = await Model.findByIdAndUpdate(
        params.id,
        { ...params, updatedBy: params.authUser ? params.authUser._id : null },
        { new: true }
      );
    } else {
      newData = await new Model({
        ...params,
        createdBy: params.authUser ? params.authUser._id : null,
      }).save();
    }
    const result = await this.details({ id: newData?._id });

    return {
      status: params.id ? 200 : 201,
      message: "Data saved",
      data: result.data,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

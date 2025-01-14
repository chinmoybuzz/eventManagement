const { search, statusSearch } = require("../helper/search.js");
const Model = require("../models/partyRole.model.js");
const { ObjectId } = require("mongoose").Types;
const slugify = require("slugify");
const errorHandler = require("../helper/errorHandler");
const { convertFieldsToAggregateObject } = require("../helper/index.js");

const findAllData = async (params) => {
  try {
    const {
      keyword,
      limit = 10,
      offset = 0,
      status,
      searchValue = false,
      selectValue = "name status ordering status createdAt updatedAt",
      sortQuery = "ordering",
      _id = null,
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    if (status) query["status"] = statusSearch(status);

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }
    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    }

    const myAggregate = Model.aggregate([{ $match: query }, { $project: { ...selectProjectParams } }]);

    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });

    return { status: 200, message: "list fetch", ...result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

const findOneData = async (params) => {
  try {
    const query = { deletedAt: null };
    if (params.code) query.code = params.code;
    else query._id = params.id;

    const data = await Model.findOne(query).select("-deletedAt -deletedBy");

    if (!data) return { status: 404, message: "Plan not found" };

    return { status: 200, message: "Data fetch successfull", data: data };
  } catch (err) {
    return errorHandler(err, params);
  }
};

const manage = async (params) => {
  try {
    if (params.id) {
      const checkData = await Model.findOne({
        _id: params.id,
        deletedAt: null,
      });
      if (!checkData) return { status: 404, message: "party role not found" };
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
    const result = await findOneData({ id: newData?._id });

    return {
      status: params.id ? 200 : 201,
      message: "Data saved",
      data: result.data,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

module.exports = {
  findAllData,
  findOneData,
  manage,
};

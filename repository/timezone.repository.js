const { ObjectId } = require("mongoose").Types;
const Model = require("../models/timezone.model.js");
const errorHandler = require("../helper/errorHandler");
const { search, statusSearch } = require("../helper/search.js");
const { convertFieldsToAggregateObject } = require("../helper/index.js");

exports.findAllData = async (params) => {
  try {
    const {
      keyword,
      limit = 10,
      offset = 0,
      status,
      searchValue = false,
      selectValue = "name offset zone",
      sortQuery = "name",
      _id = null,
      name,
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    if (status) query["status"] = statusSearch(status);
    if (name) {
      const searchQuery = searchValue
        ? searchValue.split(",")
        : select.split(" ");
      searchQuery.push("name");
      query.$or = search(searchQuery, name);
    }
    if (keyword) {
      const searchQuery = searchValue
        ? searchValue.split(",")
        : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else query._id = new ObjectId(_id);

    const myAggregate = Model.aggregate([
      { $match: query },
      { $project: selectProjectParams },
    ]);

    const result = await Model.aggregatePaginate(myAggregate, {
      offset,
      limit,
      sort: sortQuery,
    });

    return { status: 200, message: "list fetch", ...result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.findOneData = async (params) => {
  try {
    const query = { deletedAt: null };
    if (params.code) query.code = params.code;
    else query._id = params.id;

    const data = await Model.findOne(query).select(
      "-deletedAt -deletedBy -updatedAt -createdAt -updatedBy -createdBy"
    );
    if (!data) return { status: 404, message: " not found" };

    return { status: 200, message: "Data fetch successfull", data };
  } catch (err) {
    return errorHandler(err, params);
  }
};

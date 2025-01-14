const { search, statusSearch } = require("../helper/search.js");
const Model = require("../models/eventType.model.js");
const { ObjectId } = require("mongoose").Types;
const errorHandler = require("../helper/errorHandler.js");
const { convertFieldsToAggregateObject } = require("../helper/index.js");

exports.findAllData = async (params) => {
  try {
    const {
      keyword,
      limit = 10,
      offset = 0,
      status,
      searchValue = false,
      selectValue = "name description image status ordering createdAt",
      sortQuery = "-ordering",
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

    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $project: {
          ...selectProjectParams,
        },
      },
    ]);

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

exports.details = async (params) => {
  try {
    if (params.authUser) userId = new ObjectId(params.authUser._id);
    let query = { deletedAt: null };
    query["_id"] = new ObjectId(params.id);
    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $project: {
          name: 1,
          status: 1,
          ordering: 1,
        },
      },
    ]);
    const data = await Model.aggregatePaginate(myAggregate);
    if (data.length == 0) return { status: 404, message: "Event Type Not Found" };

    return { status: 200, message: "data found", data: data.docs[0] };
  } catch (error) {
    return errorHandler(error, params);
  }
};

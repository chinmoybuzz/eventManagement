const { search } = require("../helper/search.js");
const Model = require("../models/user.model.js");
const eventModel = require("../models/event.model.js");
const errorHandler = require("../helper/errorHandler");

const { CitySearchType } = require("../helper/typeConfig.js");

exports.findAllData = async (params) => {
  try {
    params.searchValue = params.searchValue || "userDetails.address.city";
    const {
      keyword,
      limit = 10,
      offset = 0,
      searchValue,
      selectValue = "userDetails.address",
      sortQuery = "ordering",
      type = CitySearchType.USER,
    } = params;
    const select = selectValue && selectValue.replaceAll(",", " ");

    let query = { deletedAt: null };

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    if (type === CitySearchType.USER) {
      const myAggregate = Model.aggregate([
        { $match: query },
        {
          $match: {
            "userDetails.address.city": {
              $exists: true,
              $ne: "",
            },
          },
        },
        {
          $project: {
            "userDetails.address.city": {
              $trim: { input: "$userDetails.address.city" },
            },
            //lowerUsername: { $toLower: "$userDetails.address.city" }
          },
        },
        {
          $set: {
            "userDetails.address.city": {
              $toLower: "$userDetails.address.city",
            },
          },
        },
        {
          $group: {
            _id: "$userDetails.address.city",
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: { city: "$_id", _id: 0 },
        },
      ]);

      var result = await Model.aggregatePaginate(myAggregate, {
        offset: offset,
        limit: limit,
        sort: sortQuery,
      });
    } else {
      const myAggregate = eventModel.aggregate([
        { $match: query },
        {
          $match: {
            "address.city": {
              $exists: true,
              $ne: "",
            },
          },
        },
        {
          $project: {
            "address.city": {
              $trim: { input: "$address.city" },
            },
          },
        },
        {
          $set: {
            "address.city": { $toLower: "$address.city" },
          },
        },
        {
          $group: {
            _id: "$address.city",
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: { city: "$_id", _id: 0 },
        },
      ]);
      var result = await eventModel.aggregatePaginate(myAggregate, {
        offset: offset,
        limit: limit,
        sort: sortQuery,
      });
    }

    return { status: 200, message: "list fetch", ...result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

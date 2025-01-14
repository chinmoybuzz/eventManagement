const { search, statusSearch } = require("../helper/search.js");
const Model = require("../models/country.model.js");
const { ObjectId } = require("mongoose").Types;
const errorHandler = require("../helper/errorHandler.js");
const { convertFieldsToAggregateObject } = require("../helper/index.js");

exports.findAllData = async (params) => {
  try {
    const {
      _id,
      name,
      status,
      keyword,
      searchValue = "name,phone_code,iso3",
      selectValue = "name cities iso3 iso2 phone_code capital currency currency_name currency_symbol timezones emoji emojiU",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");

    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = {};

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    if (status) query.status = statusSearch(status);

    if (keyword) {
      const searchQuery = searchValue
        ? searchValue.split(",")
        : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    if (name) query.name = name;

    const data = await Model.aggregate([
      { $match: query },
      { $project: { ...selectProjectParams } },
    ]);
    return { status: 200, message: "Countries fetched successfully", data };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.findOneData = async (params) => {
  try {
    const checkData = await this.findAllData({ _id: params.id });

    if (checkData.data.length == 0) {
      return { status: 404, message: "Data not found" };
    }
    return {
      status: 200,
      message: "Country details fetched successfully",
      data: checkData.data[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

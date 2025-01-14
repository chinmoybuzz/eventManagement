const { search, statusSearch } = require("../helper/search.js");
const Model = require("../models/emailTemplate.model.js");
const { ObjectId } = require("mongoose").Types;
const { convertFieldsToAggregateObject } = require("../helper/index.js");
const errorHandler = require("../helper/errorHandler.js");

exports.list = async (params) => {
  try {
    params.searchValue =
      params.searchValue ||
      "code,mailFor,subject,toMail,ccMail,fromMail,fromName";
    params.selectValue =
      params.selectValue ||
      "code mailFor subject toMail ccMail fromMail fromName createdAt";

    const {
      keyword,
      limit = 10,
      offset = 0,
      status = null,
      searchValue,
      selectValue,
      sortQuery = "-createdAt",
      _id = null,
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    if (status) query["status"] = statusSearch(status);

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    }

    if (keyword) {
      const searchQuery = searchValue
        ? searchValue.split(",")
        : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    const myAggregate = Model.aggregate([
      { $match: query },
      { $project: { ...selectProjectParams } },
    ]);

    const data = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });
    return { status: 200, message: "list fetch", ...data };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.manage = async (params) => {
  try {
    if (params.id) {
      const checkDataRes = await this.details({ id: params.id });
      if (checkDataRes.status !== 200) return checkDataRes;
    }
    delete params.code;

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
      message: params.id
        ? "Data successfully updated."
        : " Data successfully added.",
      data: result.data,
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.details = async (params) => {
  try {
    const query = { deletedAt: null };
    if (params.code) query.code = params.code;
    if (params.id) query._id = params.id;

    const data = await Model.findOne(query);
    if (!data) return { status: 404, message: "Email Template not found" };

    return { status: 200, message: "Data found", data };
  } catch (error) {
    return errorHandler(error, params);
  }
};

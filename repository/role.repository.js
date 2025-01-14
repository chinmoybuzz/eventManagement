const { search, statusSearch } = require("../helper/search");
const Model = require("../models/role.model");
const { ObjectId } = require("mongoose").Types;
const { convertFieldsToAggregateObject } = require("../helper/index");
const { errorHandler } = require("../helper/errorHandler");

exports.findAllData = async (params) => {
  try {
    const {
      _id,
      code,
      status,
      keyword,
      searchValue,
      offset = 0,
      limit = 10,
      selectValue = "name code status createdAt",
      sortQuery = "-createdAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
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

    const myAggregate = Model.aggregate([{ $match: query }, { $project: selectProjectParams }]);

    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });
    return { status: 200, message: "Role list fetched successfully", ...result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

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
      newData = await Model.create({
        ...params,
        createdBy: params.authUser ? params.authUser._id : null,
      });
    }
    const result = await this.findAllData({ _id: newData?._id });

    return {
      status: params.id ? 200 : 201,
      message: params.id ? "Role updated successfully" : "Role added successfully",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

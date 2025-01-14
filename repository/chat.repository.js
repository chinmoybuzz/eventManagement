const { search, statusSearch } = require("../helper/search");
const Model = require("../models/chat.model");
const { ObjectId } = require("mongoose").Types;
const { convertFieldsToAggregateObject } = require("../helper/index");
const errorHandler = require("../helper/errorHandler");

exports.manage = async (params) => {
  try {
    if (params.id) {
      const checkData = await Model.findOne({
        _id: params.id,
        deletedAt: null,
      });
      if (!checkData) return { status: 404, message: "Chat data not found" };
    }

    let newData;
    if (params.id) {
      newData = await Model.findByIdAndUpdate(
        params.id,
        { ...params, updatedBy: params.authUser ? params.authUser._id : null },
        { new: true }
      );
    } else {
      const totalCount = await Model.find({ deletedAt: null }).countDocuments();
      newData = await new Model({
        ...params,
        ordering: totalCount,
        createdBy: params.authUser ? params.authUser._id : null,
      }).save();
    }
    const result = await this.findAllData({ _id: newData?._id });
    return {
      status: params.id ? 200 : 201,
      message: params.id
        ? "Chat data edited successfully"
        : "Chat data added successfully",
      data: result.docs[0],
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.findAllData = async (params) => {
  try {
    const {
      _id,
      status,
      keyword,
      limit = 10,
      offset = 0,
      searchValue = false,
      sortQuery = "ordering",
      selectValue = "name description image parentId type status isChild category subcategory ordering createdAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");
    let query = { deletedAt: null };

    if (status) query.status = statusSearch(status);

    if (Array.isArray(_id) && _id.length > 0) {
      const ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    if (keyword) {
      const searchQuery = searchValue
        ? searchValue.split(",")
        : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    const myAggregate = Model.aggregate([
      { $match: query },
      { $project: selectProjectParams },
    ]);

    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });
    return {
      status: 200,
      message: "Chat list fetched successfully",
      ...result,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.findOneData = async (params) => {
  try {
    const result = await this.findAllData({ _id: params.id });
    if (result.docs.length == 0)
      return { status: 404, message: "Data not Found" };
    return {
      status: 200,
      message: "Details fetched successfully",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

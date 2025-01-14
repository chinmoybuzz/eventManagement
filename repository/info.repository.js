const { search, statusSearch } = require("../helper/search");
const Model = require("../models/info.model");
const { ObjectId } = require("mongoose").Types;
const errorHandler = require("../helper/errorHandler");
const { convertFieldsToAggregateObject } = require("../helper/index");

exports.findAllData = async (params) => {
  try {
    const {
      status,
      keyword,
      _id = null,
      page = null,
      limit = 10,
      offset = 0,
      searchValue = false,
      selectValue = "title description cards buttons page status ordering createdAt",
      sortQuery = "ordering",
    } = params;
    const select = selectValue && selectValue.replaceAll(",", " ");
    let selectProjectParams = convertFieldsToAggregateObject(select, " ");
    selectProjectParams.cards = { $sortArray: { input: "$cards", sortBy: { ordering: 1 } } };
    selectProjectParams.buttons = { $sortArray: { input: "$buttons", sortBy: { ordering: 1 } } };
    let query = { deletedAt: null };

    if (status) query["status"] = statusSearch(status);
    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }
    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    if (Array.isArray(page) && page.length > 0) {
      query["page"] = { $in: page };
    } else if (page) query["page"] = page;

    const myAggregate = Model.aggregate([{ $match: query }, { $project: selectProjectParams }]);

    const result = await Model.aggregatePaginate(myAggregate, { offset: offset, limit: limit, sort: sortQuery });
    return { status: 200, message: "Info list fetched successfully", ...result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.findOneData = async (params) => {
  try {
    let query = { daletedAt: null };
    if (params.id) query["_id"] = params.id;
    const result = await this.findAllData(query);
    if (result?.docs.length == 0) return { status: 404, message: "Info not found" };

    return { status: 200, message: "Info details fetched successfully", data: result.docs[0] };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.manage = async (params) => {
  try {
    if (params.id) {
      const checkData = await this.findAllData({ _id: params.id });
      if (!checkData) return { status: 404, message: "Info not found" };
    }
    let newData;
    if (params.id) {
      newData = await Model.findByIdAndUpdate(params.id, {
        ...params,
        updatedBy: params.authUser ? params.authUser._id : null,
      });
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
      message: params.id ? "Info edited successfully" : "Info added successfully",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

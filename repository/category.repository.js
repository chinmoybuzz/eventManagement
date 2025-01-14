const { search, statusSearch } = require("../helper/search.js");
const Model = require("../models/category.model.js");
const { ObjectId } = require("mongoose").Types;
const { convertFieldsToAggregateObject, aggregateFileConcat } = require("../helper/index.js");
const errorHandler = require("../helper/errorHandler.js");
const { uploadBinaryFile } = require("../utils/upload");

exports.manage = async (params) => {
  try {
    if (params.id) {
      const checkData = await Model.findOne({
        _id: params.id,
        deletedAt: null,
      });
      if (!checkData) return { status: 404, message: "Category not found" };
    }

    if (params.file) {
      const up = await uploadBinaryFile({ folder: "category", file: params.file });
      params.image = up;
    } else delete params.image;

    if (params.parentId) params.isChild = 1;

    let newData;
    if (params.id) {
      newData = await Model.findByIdAndUpdate(
        params.id,
        { ...params, updatedBy: params.authUser ? params.authUser._id : null },
        { new: true }
      );
    } else {
      const isExist = await Model.findOne({
        type: params.type,
        name: params.name,
        parentId: params.parentId,
        deletedAt: null,
      });
      if (isExist) return { status: 400, message: "Category already exist" };

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
      message: "Data saved",
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
      type,
      status,
      keyword,
      isChild,
      parentId,
      limit = 10,
      offset = 0,
      searchValue,
      sortQuery = "ordering",
      selectValue = "name description image parentId type status isChild category subcategory ordering createdAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");
    let query = { deletedAt: null };

    if (status) query.status = statusSearch(status);
    if (isChild) query.isChild = parseInt(isChild);

    if (Array.isArray(_id) && _id.length > 0) {
      const ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    if (Array.isArray(parentId) && parentId.length > 0) {
      const parentIds = parentId.map((el) => new ObjectId(el));
      query["parentId"] = { $in: parentIds };
    } else if (parentId) query["parentId"] = new ObjectId(parentId);

    if (Array.isArray(type) && type.length > 0) {
      const types = type.map((el) => parseInt(el));
      query["type"] = { $in: types };
    } else if (type) query["type"] = parseInt(type);

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "parentId",
          as: "category",
          pipeline: [
            { $match: { $expr: { $eq: ["$deletedAt", null] } } },
            {
              $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "parentId",
                as: "subcategory",
                pipeline: [
                  { $match: { $expr: { $eq: ["$deletedAt", null] } } },
                  { $project: selectProjectParams },
                  { $set: { "image.url": aggregateFileConcat("$image.url") } },
                ],
              },
            },
            { $project: selectProjectParams },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "categories",
          as: "global_category",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$deletedAt", null] },
                    { $ne: ["$parentId", null] },
                    { $eq: ["$type", parseInt(type)] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "parentId",
                as: "subcategory",
                pipeline: [{ $match: { $expr: { $eq: ["$deletedAt", null] } } }, { $project: { name: 1 } }],
              },
            },
            { $project: { name: 1 } },
          ],
        },
      },
      { $addFields: { subCatNames: "$global_category.subcategory.name" } },
      {
        $project: {
          ...selectProjectParams,
          allCatNames: {
            $concatArrays: ["$global_category.name", "$subCatNames"],
          },
        },
      },
      { $set: { "image.url": aggregateFileConcat("$image.url") } },
      { $match: { $expr: { $not: [{ $in: ["$name", "$allCatNames"] }] } } },
      { $project: { allCatNames: 0 } },
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

exports.findOneData = async (params) => {
  try {
    const result = await this.findAllData({ _id: params.id });
    if (result.docs.length == 0) return { status: 404, message: "Data not Found" };
    return {
      status: 200,
      message: "Details fetched successfully",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

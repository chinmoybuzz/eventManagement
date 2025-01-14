const {
  convertFieldsToAggregateObject,
  concatArrayFile,
  aggregateFileConcat,
  createSlug,
  createGroupProjectionObject,
} = require("../helper/index.js");
const { ObjectId } = require("mongoose").Types;
const Model = require("../models/service.model.js");
const errorHandler = require("../helper/errorHandler.js");
const { uploadBinaryFile, deleteFile } = require("../utils/upload.js");
const { search, statusSearch } = require("../helper/search.js");
const { isValidObjectId } = require("mongoose");

exports.manage = async (params) => {
  try {
    let newData, checkData;
    if (params.id) {
      checkData = await Model.findOne({ _id: params.id, deletedAt: null });
      if (!checkData) return { status: 404, message: "Service not found" };
    }

    let galleryArr = [];
    if (Array.isArray(params.gallery) && params.gallery.length > 0) {
      for (let file of params.gallery) {
        const up = await uploadBinaryFile({ folder: "service", file });
        if (up?.url) galleryArr.push(up);
      }
      params.gallery = galleryArr;
    } else delete params.gallery;

    if (params.cover.length > 0) {
      if (checkData && checkData?.cover?.url) deleteFile(checkData?.cover?.url);
      const up = await uploadBinaryFile({
        file: params.cover[0],
        folder: "user",
      });
      params.cover = up;
    } else delete params.cover;

    if (!params.vendorId) params.vendorId = params.authUser?._id;

    if (params.name) params.slug = createSlug(params.name);

    if (params.hourlyRate) params.hourlyRate = parseInt(params.hourlyRate);

    if (params.id) {
      if (Array.isArray(params.gallery) && params.gallery.length > 0) delete params.gallery;

      newData = await Model.findByIdAndUpdate(
        params.id,
        { ...params, updatedBy: params.authUser ? params.authUser._id : null },
        { new: true }
      );

      newData = await Model.findOneAndUpdate(
        { _id: params?.id },
        { $push: { gallery: { $each: galleryArr } } },
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
      message: params.id ? "Service updated successfully" : "Service added successfully",
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
      slug,
      status,
      keyword,
      featured,
      vendorId,
      subcategoryId,
      limit = 10,
      offset = 0,
      searchValue = "email,name,description,subcategories,address.address1,address.address2,address.city,address.state,address.country,vendor.fullname.firstName",
      sortQuery = "ordering",
      selectValue = "name slug description cover subcategories gallery address vendor status featured hourlyRate ordering createdAt updatedAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");
    const selectGroupParams = createGroupProjectionObject(select);

    let query = { deletedAt: null };

    if (slug) query["slug"] = slug;
    if (status) query["status"] = statusSearch(status);
    if (featured) query["featured"] = statusSearch(featured);
    if (vendorId) query["vendorId"] = new ObjectId(vendorId);
    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query._id = new ObjectId(_id);

    if (Array.isArray(subcategoryId) && subcategoryId.length > 0) {
      let ids = subcategoryId.map((el) => new ObjectId(el));
      query["subcategoryId"] = { $in: ids };
    } else if (subcategoryId) query.subcategoryId = new ObjectId(subcategoryId);

    let optionalQuery = { deletedAt: null };

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      optionalQuery.$or = search(searchQuery, keyword);
      if (keyword.includes(" ")) {
        optionalQuery.$or.push({
          $and: [
            { "vendor.fullname.firstName": { $regex: keyword.split(" ")[0], $options: "i" } },
            { "vendor.fullname.lastName": { $regex: keyword.split(" ")[1], $options: "i" } },
          ],
        });
      }
    }

    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendor",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { fullname: 1, email: 1, image: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "subcategoryId",
          foreignField: "_id",
          as: "subcategories",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { name: 1, image: 1, type: 1, subcategory: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "serviceId",
          as: "reviews",
          pipeline: [
            // {
            //   $lookup: {
            //     from: "users",
            //     localField: "userId",
            //     foreignField: "_id",
            //     as: "reviewer",
            //     pipeline: [
            //       { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            //       { $project: { fullname: 1, email: 1, image: 1 } },
            //       { $set: { "image.url": aggregateFileConcat("$image.url") } },
            //     ],
            //   },
            // },
            // { $project: { review: 1, rating: 1, createdAt: 1, status: 1, reviewer: 1 } },
            { $group: { _id: null, rating: { $avg: "$rating" } } },
            // { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true } },
          ],
        },
      },
      concatArrayFile("gallery"),
      { $set: { "cover.url": aggregateFileConcat("$cover.url") } },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: true } },
      { $project: { ...selectProjectParams, rating: "$reviews.rating" } },
      { $match: { ...optionalQuery } },
    ]);

    const result = await Model.aggregatePaginate(myAggregate, { offset, limit, sort: sortQuery });
    return {
      status: 200,
      message: "Service list fetched successfully",
      ...result,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.findOneData = async (params) => {
  try {
    let query = { deletedAt: null };
    if (isValidObjectId(params.id)) {
      query._id = params.id;
    } else query.slug = params.id;
    const result = await this.findAllData(query);
    if (result.docs.length == 0) return { status: 404, message: "Service not found" };
    return {
      status: 200,
      message: "Service data fetched successfully",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.categoriesGroup = async () => {
  try {
    const data = await Model.aggregate([
      { $match: { deletedAt: null } },
      {
        $lookup: {
          from: "categories",
          localField: "subcategoryId",
          foreignField: "_id",
          as: "subcategories",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { name: 1, ordering: 1 } },
          ],
        },
      },
      { $unwind: "$subcategories" },
      {
        $group: {
          _id: "$subcategories._id",
          subcategory: { $first: "$subcategories.name" },
          ordering: { $first: "$subcategories.ordering" },
        },
      },
      { $sort: { ordering: 1 } },
    ]);
    return { status: 200, data, message: "Service categories fetched successfully" };
  } catch (error) {
    return errorHandler(error, (params = {}));
  }
};

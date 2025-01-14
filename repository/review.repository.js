const { search } = require("../helper/search");
const Model = require("../models/review.model");
const Service = require("../models/service.model");
const { ObjectId } = require("mongoose").Types;
const errorHandler = require("../helper/errorHandler");
const { convertFieldsToAggregateObject, aggregateFileConcat } = require("../helper/index");

exports.findAllData = async (params) => {
  try {
    const {
      _id,
      vendorId,
      createdBy,
      keyword,
      serviceId,
      limit = 10,
      offset = 0,
      searchValue,
      sortQuery = "-createdAt",
      selectValue = "title status flexibility qualityOfServices responseTime skill value review reviewer rating service vendor createdAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query._id = new ObjectId(_id);

    if (Array.isArray(vendorId) && vendorId.length > 0) {
      let ids = vendorId.map((el) => new ObjectId(el));
      query["vendorId"] = { $in: ids };
    } else if (vendorId) query.vendorId = new ObjectId(vendorId);

    if (Array.isArray(createdBy) && createdBy.length > 0) {
      let ids = createdBy.map((el) => new ObjectId(el));
      query["createdBy"] = { $in: ids };
    } else if (createdBy) query.createdBy = new ObjectId(createdBy);

    if (Array.isArray(serviceId) && serviceId.length > 0) {
      let ids = serviceId.map((el) => new ObjectId(el));
      query["serviceId"] = { $in: ids };
    } else if (serviceId) query.serviceId = new ObjectId(serviceId);

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
            { $project: { fullname: 1, image: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "reviewer",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { fullname: 1, image: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "service",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { name: 1, slug: 1, shortDescription: 1 } },
          ],
        },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
      { $project: selectProjectParams },
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

    if (result.docs.length === 0) return { status: 404, message: "Review not found" };

    return {
      status: 200,
      message: "Review fetched successfully",
      data: result.docs[0],
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.manage = async (params) => {
  try {
    const { authUser, id, flexibility, qualityOfServices, responseTime, skill, value, serviceId } = params;
    let checkData;
    if (id) {
      checkData = await Model.findOne({ _id: id, deletedAt: null });
      if (!checkData) return { status: 404, message: "Review not found" };
    }
    if (!serviceId) return { status: 400, message: "Please select a service" };
    if (!flexibility && flexibility != 0) return { status: 400, message: "Please select a flexibility rating" };
    if (!qualityOfServices && qualityOfServices != 0)
      return { status: 400, message: "Please select a services quality rating" };
    if (!responseTime && responseTime != 0) return { status: 400, message: "Please select a response time rating" };
    if (!skill && skill != 0) return { status: 400, message: "Please select a skill rating" };
    if (!value && value != 0) return { status: 400, message: "Please select a value rating" };

    const service = await Service.findById({ _id: serviceId }).select("vendorId");
    if (!service) return { status: 404, message: "Service not found" };

    params.vendorId = service.vendorId;
    params.rating = (flexibility + qualityOfServices + responseTime + skill + value) / 5;

    let newData;
    if (id) {
      if (authUser.code != "admin" && authUser._id.toString() != checkData.createdBy.toString()) {
        return { status: 403, message: "You can not edit this review" };
      }
      newData = await Model.findByIdAndUpdate(
        id,
        { ...params, updatedBy: authUser ? authUser._id : null },
        { new: true }
      );
    } else {
      newData = await Model.create({ ...params, createdBy: authUser ? authUser._id : null });
    }
    const result = await this.findAllData({ _id: newData?._id });

    return {
      status: id ? 200 : 201,
      message: id ? "Review updated successfully" : "Review added successfully",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.review = async (params) => {
  try {
    const {
      _id,
      vendorId,
      keyword,
      serviceId,
      limit = 10,
      offset = 0,
      searchValue,
      sortQuery = "-createdAt",
      selectValue = "title status flexibility qualityOfServices responseTime skill value review reviewer rating service vendor createdAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };

    if (vendorId) query["vendorId"] = new ObjectId(vendorId);

    if (serviceId) query["serviceId"] = new ObjectId(serviceId);

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query._id = new ObjectId(_id);

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
            { $project: { fullname: 1, image: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "reviewer",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { fullname: 1, image: 1, username: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "service",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { name: 1, slug: 1, shortDescription: 1 } },
          ],
        },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
      { $project: selectProjectParams },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          averageFlexibility: { $avg: "$flexibility" },
          averageQualityOfServices: { $avg: "$qualityOfServices" },
          averageResponseTime: { $avg: "$responseTime" },
          averageSkill: { $avg: "$skill" },
          averageValue: { $avg: "$value" },
          reviews: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: 1,
          reviews: 1,
          averageFlexibility: 1,
          averageQualityOfServices: 1,
          averageResponseTime: 1,
          averageSkill: 1,
          averageValue: 1,
        },
      },
    ]);

    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });
    return {
      status: 200,
      message: "Review fetched successfully",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

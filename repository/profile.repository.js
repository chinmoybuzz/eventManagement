const Model = require("../models/user.model");
const errorHandler = require("../helper/errorHandler");
const { aggregateFileConcat, convertFieldsToAggregateObject, concatArrayFile } = require("../helper");
const { ObjectId } = require("mongoose").Types;
const { uploadBinaryFile, deleteFile } = require("../utils/upload");

exports.profile = async (params) => {
  try {
    const {
      username,
      userId,
      authUser,
      selectValue = "fullname username isVendor email similarVendors openTime image portfolioImage emailVerified emailVerifiedAt status address social about skills hourlyRate categories dateOfBirth phone isFeatured isIdentifyVerified isMembershipVerified isPreferredVendor isPhoneVerified paymentAccepted terms open createdAt favouriteVendors passwordResetDate isPasswordExpired isTopVendor",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");
    let query = { deletedAt: null };

    if (username) query.username = username;
    if (userId) query._id = new ObjectId(userId);
    if (authUser) query._id = new ObjectId(authUser._id);

    const data = await Model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories",
          foreignField: "_id",
          localField: "categoryId",
          as: "categories",
          pipeline: [
            { $match: { $expr: { $eq: ["$deletedAt", null] } } },
            { $project: { name: 1, image: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          foreignField: "categoryId",
          localField: "categoryId",
          as: "similarVendors",
          pipeline: [
            { $match: { $expr: { $eq: ["$deletedAt", null] } } },
            {
              $lookup: {
                from: "reviews",
                foreignField: "vendorId",
                localField: "_id",
                as: "review",
                pipeline: [
                  { $group: { _id: null, averageRating: { $avg: "$rating" } } },
                  { $project: { _id: 0, averageRating: 1 } },
                ],
              },
            },
            { $unwind: { path: "$review", preserveNullAndEmptyArrays: true } },
            { $addFields: { rating: "$review.averageRating" } },
            { $project: { fullname: 1, image: 1, about: 1, rating: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "vendorId",
          as: "bookedBy",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $group: { _id: "$userId", booked: { $sum: 1 } } },
          ],
        },
      },
      { $set: { "image.url": aggregateFileConcat("$image.url") } },
      concatArrayFile("portfolioImage"),
      {
        $project: {
          ...selectProjectParams,
          bookedBy: {
            $filter: {
              input: "$bookedBy",
              as: "booking",
              cond: { $gte: ["$$booking.booked", 2] },
            },
          },
        },
      },
      {
        $addFields: {
          isPasswordExpired: {
            $cond: {
              if: { $gte: [{ $subtract: [new Date(), "$passwordResetDate"] }, 90 * 24 * 60 * 60 * 1000] },
              then: true,
              else: false,
            },
          },
          hired: { $size: "$bookedBy" },
        },
      },
      { $project: { bookedBy: 0 } },
    ]);
    if (data.length == 0) return { status: 404, message: "Profile not found" };
    return {
      status: 200,
      message: "Profile details fetched successfully",
      data: data[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.profileImage = async (params) => {
  try {
    let newData, checkData;
    params.id = params.id ? new ObjectId(params.id) : new ObjectId(params.authUser._id);
    if (params.id) {
      checkData = await Model.findOne({ _id: params.id, deletedAt: null });
      if (!checkData) return { status: 404, message: "User not found" };

      if (params.image.length > 0) {
        if (checkData && checkData?.image?.url) deleteFile(checkData?.image?.url);
        const up = await uploadBinaryFile({
          file: params.image[0],
          folder: "user",
        });
        params.image = up;
      }
      newData = await Model.findByIdAndUpdate(
        params.id,
        { ...params, updatedBy: params.authUser ? params.authUser._id : null },
        { new: true }
      );

      const result = await this.profile({ id: newData?._id });
      return {
        status: 200,
        message: "Profile Image Updated",
        data: result.data,
      };
    } else {
      return {
        status: 400,
        messge: "User Id not found",
      };
    }
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.profileUpdate = async (params) => {
  try {
    let newData;
    const { id, authUser } = params;

    if (id) {
      params.id = new ObjectId(id);
    } else new ObjectId(authUser._id);

    checkData = await Model.findOne({ _id: id, deletedAt: null });
    if (!checkData) return { status: 404, message: "User not found" };

    newData = await Model.findByIdAndUpdate(params.id, {
      ...params,
      updatedBy: params.authUser ? params.authUser._id : null,
    });

    const result = await this.profile({ id: newData?._id });

    return { status: 200, message: "Profile updated successfully", data: result.data };
  } catch (error) {
    return errorHandler(error, params);
  }
};

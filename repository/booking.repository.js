const { search, statusSearch } = require("../helper/search.js");
const Model = require("../models/booking.model.js");
const { ObjectId } = require("mongoose").Types;
const errorHandler = require("../helper/errorHandler");
const { convertFieldsToAggregateObject, aggregateFileConcat } = require("../helper/index.js");
const { commonEmailThankYou } = require("../mails/sendEmail.js");

exports.findAllData = async (params) => {
  try {
    const {
      _id,
      userId,
      vendorId,
      status,
      keyword,
      startDate,
      endDate,
      serviceId,
      numberOfGuest,
      partyLocation,
      limit = 10,
      offset = 0,
      isCalendar = false,
      searchValue = false,
      sortQuery = "ordering",
      selectValue = "eventType eventStatus startDate endDate eventVenue numberOfGuest eventLocation vendorStartTime vendorBudget vendorLength details vendorsCotactCount contactDetails bookingType status ordering createdAt updatedAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    if (status) query["status"] = statusSearch(status);
    if (vendorId) query["vendorId"] = new ObjectId(vendorId);
    if (serviceId) query["serviceId"] = ObjectId.isValid(serviceId) ? new ObjectId(serviceId) : undefined;
    if (numberOfGuest) query.numberOfGuest = parseInt(numberOfGuest);
    if (startDate) query["startDate"] = { $gte: new Date(startDate) };
    if (endDate) query["endDate"] = { $lte: new Date(endDate) };
    if (userId) query["userId"] = ObjectId.isValid(userId) ? new ObjectId(userId) : undefined;

    if (partyLocation) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      searchQuery.push("partyLocation.address1");
      query.$or = search(searchQuery, partyLocation);
    }

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    let optionalQuery = [{ $match: { deleteAt: null } }];

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      optionalQuery[0].$match.$or = search(searchQuery, keyword);
    }
    if (isCalendar) {
      optionalQuery.push(
        { $project: { title: "$service.name", start: "$startDate", end: "$endDate" } },
        {
          $addFields: {
            allDay: {
              $cond: {
                if: { $gte: [{ $subtract: ["$end", "$start"] }, 1 * 24 * 60 * 60 * 1000] },
                then: true,
                else: false,
              },
            },
          },
        }
      );
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
            { $project: { fullname: 1, roleCode: 1, image: 1, email: 1 } },
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
      {
        $lookup: {
          from: "partyroles",
          localField: "partyRole",
          foreignField: "_id",
          as: "partyrole",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { name: 1, slug: 1, shortDescription: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "bookedBy",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { fullname: 1, roleCode: 1, image: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "timezones",
          localField: "timeZoneId",
          foreignField: "_id",
          as: "timezone",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { name: 1, status: 1 } },
          ],
        },
      },
      {
        $project: {
          ...selectProjectParams,
          partyrole: { $arrayElemAt: ["$partyrole", 0] },
          timezone: { $arrayElemAt: ["$timezone", 0] },
          vendor: { $arrayElemAt: ["$vendor", 0] },
          service: { $arrayElemAt: ["$service", 0] },
          bookedBy: { $arrayElemAt: ["$bookedBy", 0] },
        },
      },
      ...optionalQuery,
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
    if (result.docs.length == 0) return { status: 404, message: "Booking not found" };
    return {
      status: 200,
      message: "Data fetch successfull",
      data: result.docs[0],
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.manage = async (params) => {
  try {
    if (params.id) {
      const checkData = await Model.findOne({
        _id: params.id,
        deletedAt: null,
      });
      if (!checkData) return { status: 404, message: "party role not found" };
    }

    if (params.numberOfGuest) params.numberOfGuest = parseInt(params.numberOfGuest);
    if (params.vendorBudget) params.vendorBudget = parseInt(params.vendorBudget);
    if (params.vendorLength) params.vendorLength = parseInt(params.vendorLength);
    if (params.vendorsCotactCount) params.vendorsCotactCount = parseInt(params.vendorsCotactCount);
    if (params.status) params.status = parseInt(params.status);
    if (params.ordering) params.ordering = parseInt(params.ordering);

    const totalCount = await Model.find({ deletedAt: null }).countDocuments();

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
        ordering: totalCount,
        userId: params?.userId ? params?.userId : params?.authUser?._id,
        createdBy: params.authUser ? params.authUser._id : null,
      }).save();
    }
    const result = await this.findAllData({ _id: newData?._id });
    //user
    await commonEmailThankYou(
      {
        user: {
          fullname: { firstName: `${params.contactDetails.firstName}`, lastName: `${params.contactDetails.lastName}` },
          email: params.contactDetails.email,
        },
        toMail: { email: params.contactDetails.email },
      },
      "BOOKING_RESPONSE_USER"
    );

    await commonEmailThankYou(
      {
        bookingTitle: params.eventType,
        user: {
          fullname: { firstName: `${params.contactDetails.firstName}`, lastName: `${params.contactDetails.lastName}` },
          email: params.contactDetails.email,
        },
        toMail: { email: await result.docs[0].vendor.email },
      },
      "BOOKING_RESPONSE_ADMIN"
    );

    return {
      status: params.id ? 200 : 201,
      message: params.id ? "Booking edited successfully" : "Booking successful",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

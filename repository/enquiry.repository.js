const { search, statusSearch } = require("../helper/search");
const Model = require("../models/enquiry.model");
const { ObjectId } = require("mongoose").Types;
const errorHandler = require("../helper/errorHandler");
const { convertFieldsToAggregateObject, aggregateFileConcat } = require("../helper/index");
const { commonEmailThankYou } = require("../mails/sendEmail");

exports.findAllData = async (params) => {
  try {
    const {
      keyword,
      limit = 10,
      offset = 0,
      status = null,
      searchValue = "fullname,email,phone,phoneCode,description",
      selectValue = "fullname email enquirytype chat service phone phoneCode message subject status ticketNo createdBy createdAt",
      sortQuery = "-createdAt",
      enquirytype = null,
      serviceId = null,
      _id = null,
    } = params;
    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query._id = new ObjectId(_id);
    if (serviceId) query.serviceId = new ObjectId(serviceId);
    if (status) query.status = statusSearch(status);
    if (enquirytype) query.enquirytype = enquirytype;
    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "bookings",
          localField: "bookingId",
          foreignField: "_id",
          as: "booking",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { numberOfGuest: 1, eventLocation: 1, vendorStartTime: 1, details: 1 } },
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
            { $match: { $expr: { $eq: ["$deletedAt", null] } } },
            {
              $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "vendorId",
                as: "venderDetails",
                pipeline: [{ $project: { fullname: 1 } }],
              },
            },
            { $project: { name: 1, slug: 1, venderDetails: { $arrayElemAt: ["$venderDetails", 0] } } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { fullname: 1, image: 1, email: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $project: {
          ...selectProjectParams,

          service: { $arrayElemAt: ["$service", 0] },
          booking: { $arrayElemAt: ["$booking", 0] },
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
    ]);
    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });

    return { status: 200, message: "Enquiry list fetched successfully", ...result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.findOneData = async (params) => {
  try {
    let query = { deletedAt: null };
    query["_id"] = new ObjectId(params.id);

    const result = await this.findAllData({ _id: query._id });

    return { status: 200, message: "Enquiry list fetched successfully", data: result.docs[0] };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.manage = async (params) => {
  try {
    let checkData;
    if (params.id) {
      checkData = await Model.findOne({ _id: new ObjectId(params.id), deletedAt: null });
      if (!checkData) return { status: 400, message: "Data not found" };
    }
    if (params.chat) {
      params.chat.senderId = params.authUser._id;
    }
    params.userId = params.userId || params.authUser._id;
    params.fullname = params.fullname || params.authUser.fullname;
    params.email = params.email || params.authUser.email;
    let newData;
    if (params.id) {
      if (params.chat) {
        params.chat = [...checkData.chat, params.chat];
      }

      newData = await Model.findByIdAndUpdate(params.id, {
        ...params,
        updatedBy: params.authUser ? params.authUser._id : null,
      });
    } else {
      const totalCount = await Model.find({ deletedAt: null }).countDocuments();
      if (params.enquirytype === "COMPLAIN") {
        const ticketNo = `TID-${(totalCount + 1).toString().padStart(10, "0")}`;
        params.ticketNo = ticketNo;
      }
      newData = await new Model({ ...params, createdBy: params.authUser ? params.authUser._id : null }).save();
      await commonEmailThankYou(
        {
          ...params,

          user: { fullname: params.fullname, email: params.email ? params.email : "N/A" },
          phone: params.Phone ? params.Phone : "N/A",
          phoneCode: params.phoneCode ? params.phoneCode : "",
          toMail: { email: params.email },
        },
        "ENQUIRY_RESPONSE"
      );
    }

    const result = await this.findAllData({ _id: newData?._id.toString() });

    return {
      status: params.id ? 200 : 201,
      message: "Success",
      data: result.docs,
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

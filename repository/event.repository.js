const { search, statusSearch } = require("../helper/search.js");
const Model = require("../models/event.model.js");
const { ObjectId } = require("mongoose").Types;
const slugify = require("slugify");
const errorHandler = require("../helper/errorHandler.js");
const {
  convertFieldsToAggregateObject,
  aggregateFileConcat,
  fileConcat,
  concatArrayFile,
} = require("../helper/index.js");
const { USER_SHOW_FIELDS, AggregateSelect } = require("../helper/typeConfig.js");
const { uploadBinaryFile, deleteFile } = require("../utils/upload.js");
const { commonEmailThankYou } = require("../mails/sendEmail");

exports.list = async (params) => {
  try {
    const {
      keyword,
      limit = 10,
      offset = 0,
      status,
      isFeature,
      price,
      startDate,
      endDate,
      searchValue = false,
      selectValue = "title slug isFeature price shortDescription startDate endDate gallery address venue isOnline eventLink status ordering createdAt organizer attendees category",
      sortQuery = "ordering",
      city,
      _id = null,
      organizer = null,
      categoryId,
    } = params;
    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");
    // const currentDate = new Date();
    let query = { deletedAt: null };
    if (status) query["status"] = statusSearch(status);
    if (isFeature) query["isFeature"] = statusSearch(isFeature);
    if (price) query["price"] = parseInt(price);

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    if (params.startDate && params.startDate != "null" && params.endDate && params.endDate != "null") {
      query.startDate = {
        $gte: new Date(params.startDate),
        $lte: new Date(params.endDate),
      };
    } else if (params.upcomingEvents === "true") {
      query.endDate = {
        $gte: new Date(),
      };
      // query.$and = [
      // { startDate: {$gte: new Date()}},
      // // { endDate: {$lte: startDate}},
      // ]
    }
    // if (params.upcomingEvents === "true") {
    //   query.$and =[
    //    { startDate: {$gte: new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000)}}, // 15 days ago
    //    { startDate: {$lte: new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000)}}, // 15 days from now
    //   ]
    // }

    if (city) {
      query.$and = [{ "address.city": { $eq: city } }, { "address.city": { $ne: null } }];
    }
    if (params.upcomingEvents === "true") {
      if (city) {
        query.$and = [
          {
            "address.city": { $in: params.city ? JSON.parse(params.city) : [] },
          },
          { "address.city": { $ne: null } },
        ];
      }
    }

    if (organizer) query["organizer"] = new ObjectId(organizer);
    if (categoryId) query["categoryId"] = new ObjectId(categoryId);

    if (params.favourite === "event") {
      query.$and = [{ eventFavorite: { $ne: null } }, { eventFavorite: { $eq: params.authUser._id } }];
    }
    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }
    let userId = null;
    if (params.authUser) userId = new ObjectId(params.authUser._id);

    const myAggregate = Model.aggregate([
      { $match: query },
      concatArrayFile("gallery"),
      // {
      //   $match: {
      //     startDate: {
      //       $gte: new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      //       $lte: new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      //     },
      //   },
      // },
      {
        $lookup: {
          from: "users",
          localField: "organizer",
          foreignField: "_id",
          as: "organizer",
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } }, { $project: USER_SHOW_FIELDS }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "attendees",
          foreignField: "_id",
          as: "attendees",
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } }, { $project: USER_SHOW_FIELDS }],
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { name: 1, image: aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $set: {
          organizer: { $arrayElemAt: ["$organizer", 0] },
          category: { $arrayElemAt: ["$category", 0] },
        },
      },
      {
        $project: {
          ...selectProjectParams,
          totalEnroll: { $size: "$attendees" },
          isFavorite: {
            $and: [{ $isArray: "$eventFavorite" }, { $in: [userId, "$eventFavorite"] }],
          },
        },
      },
      // {
      //   $addFields: {
      //     daysUntilStartDate: {
      //       $divide: [
      //         {
      //           $subtract: ["$startDate", currentDate],
      //         },
      //         1000 * 60 * 60 * 24, // Convert milliseconds to days
      //       ],
      //     },
      //   },
      // },
      // {
      //   $sort: {
      //     daysUntilStartDate: 1, // Sort by days until start date in ascending order
      //   },
      // },
    ]);
    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });
    return { status: 200, message: "list fetch", result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.details = async (params) => {
  try {
    let userId = null;
    if (params.authUser) userId = new ObjectId(params.authUser._id);

    const data = await Model.aggregate([
      { $match: { _id: new ObjectId(params.id), deletedAt: null } },
      concatArrayFile("gallery"),
      {
        $lookup: {
          from: "users",
          localField: "organizer",
          foreignField: "_id",
          as: "organizer",
          pipeline: [{ $project: AggregateSelect.USER_BASIC_FIELDS }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "attendees",
          foreignField: "_id",
          as: "attendees",
          pipeline: [{ $project: AggregateSelect.USER_BASIC_FIELDS }],
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            {
              $project: {
                name: 1,
                image: aggregateFileConcat("$image.url"),
              },
            },
          ],
        },
      },
      {
        $set: {
          organizer: { $arrayElemAt: ["$organizer", 0] },
          category: { $arrayElemAt: ["$category", 0] },
          totalEnroll: { $size: "$attendees" },
          isFavorite: {
            $and: [{ $isArray: "$eventFavorite" }, { $in: [userId, "$eventFavorite"] }],
          },
        },
      },
      { $project: { categoryId: 0, deletedAt: 0, deletedBy: 0 } },
    ]);

    if (data.length == 0) return { status: 404, message: "Event Not Found" };

    return { status: 200, message: "data found", data: data[0] };
  } catch (error) {
    return errorHandler(error, params);
  }
};

const manage = async (params) => {
  try {
    let checkData = null;
    if (params.id) {
      checkData = await Model.findOne({ _id: params.id, deletedAt: null });
      if (!checkData) return { status: 404, message: "Data not found" };
    }

    if (params.image) {
      if (checkData && checkData.image) deleteFile(checkData.image);
      const up = await uploadBinaryFile({
        folder: "event",
        file: params.image,
      });
      params.image = up?.path;
    } else delete params.image;

    if (params.gallery.length > 0) {
      let arr = [];
      if (checkData && Array.isArray(checkData.gallery)) {
        arr.concat(checkData.gallery);
      }

      for (let file of params.gallery) {
        const up = await uploadBinaryFile({
          folder: "event",
          file: file,
        });
        if (up?.url) arr.push(up);
      }
      params.gallery = arr;
    } else delete params.gallery;

    if (!params.organizer) params.organizer = params.authUser._id;

    if (params.tags && params.tags.length > 0)
      params.tags = params.tags.map((tag) => {
        return { title: tag };
      });

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
        slug: slugify(params.title, "-") + Date.now(),
        createdBy: params.authUser ? params.authUser._id : null,
      }).save();
    }
    const result = await this.details({ id: newData?._id });

    return {
      status: params.id ? 200 : 201,
      message: "Data saved",
      data: result.data,
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.addData = async (params) => {
  delete params.id;
  return manage(params);
};

exports.updateData = async (params) => {
  if (!params.id) return { status: 400, message: "Id is required" };

  return manage(params);
};

exports.enroll = async (params) => {
  try {
    const checkData = await Model.findOne({
      _id: params.id,
      deletedAt: null,
    }).lean();
    if (!checkData) return { status: 404, message: "Event Not Found" };
    for (let id of checkData.attendees) {
      if (id.toString() == params.authUser._id) return { status: 400, message: "You have already Enrolled" };
    }

    await Model.findOneAndUpdate(
      { _id: checkData._id },
      { $addToSet: { attendees: params.authUser._id } },
      { new: false }
    );

    await commonEmailThankYou(
      {
        toMail: { email: params.authUser.email },
        user: { fullname: params.authUser.fullname },
      },
      "EVENT_ENROLL_SUBMITED_FOR_ATTENDEES_USER"
    );
    return {
      status: 200,
      message: "Congratulations! You have enrolled for event",
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.manageFavorite = async (params) => {
  try {
    const checkData = await Model.findOne({
      _id: params.eventId,
      deletedAt: null,
    }).lean();
    if (!checkData) return { status: 404, message: "Event Not Found" };
    let userId = new ObjectId(params.authUser._id);
    checkData.eventFavorite = checkData.eventFavorite.map((id) => id.toString());
    const index = checkData.eventFavorite.indexOf(userId.toString());

    if (index == -1) {
      await Model.findOneAndUpdate(
        { _id: checkData._id },
        { $addToSet: { eventFavorite: params.authUser._id } },
        { new: false }
      );
    } else {
      await Model.findOneAndUpdate(
        { _id: checkData._id },
        { $pull: { eventFavorite: { $eq: userId } } },
        { new: false }
      );
    }
    return { status: 200, message: "favorite change" };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.recomendedList = async (params) => {
  try {
    const {
      keyword,
      limit = 10,
      offset = 0,
      status,
      isFeature,
      price,
      searchValue = false,
      selectValue = "title slug isFeature price categoryId shortDescription startDate endDate image address venue isOnline eventLink status ordering createdAt organizer attendees category",
      sortQuery = "ordering",
      _id = null,
      organizer = null,
      categoryId,
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");
    let userId = null;
    userId = new ObjectId(params?.authUser?._id);
    let query = { deletedAt: null };

    const eventCategoryList = await Model.aggregate([
      {
        $match: { attendees: { $eq: userId }, deletedAt: null },
      },
      {
        $project: {
          categoryId: 1,
        },
      },
      {
        $group: {
          _id: "$categoryId",
        },
      },
      {
        $group: {
          _id: null,
          categoryArray: { $push: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          categoryArray: 1,
        },
      },
    ]);

    if (status) query["status"] = statusSearch(status);
    if (isFeature) query["isFeature"] = statusSearch(isFeature);
    if (price) query["price"] = parseInt(price);
    if (params.startDate && params.startDate != "null" && params.endDate && params.endDate != "null") {
      query.startDate = {
        $gte: new Date(params.startDate),
        $lte: new Date(params.endDate),
      };
    } else if (params.upcomingEvents === "true") {
      query.endDate = {
        $gte: new Date(),
      };
    }

    if (params.categoryId) {
      query.$and = [
        { categoryId: { $eq: new ObjectId(params.categoryId) } },
        {
          attendees: { $eq: userId },
        },
      ];
    } else {
      if (params?.authUser?._id) {
        query.$and = [
          {
            categoryId: {
              $in: eventCategoryList[0]?.categoryArray || [],
            },
          },
        ];
      }
    }
    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "organizer",
          foreignField: "_id",
          as: "organizer",
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } }, { $project: USER_SHOW_FIELDS }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "attendees",
          foreignField: "_id",
          as: "attendees",
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } }, { $project: USER_SHOW_FIELDS }],
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            {
              $project: {
                name: 1,
                image: aggregateFileConcat("$image"),
              },
            },
          ],
        },
      },
      {
        $set: {
          organizer: { $arrayElemAt: ["$organizer", 0] },
          category: { $arrayElemAt: ["$category", 0] },
          image: aggregateFileConcat("$image"),
          gallery: concatArrayFile("$gallery"),
        },
      },
      {
        $project: {
          title: 1,
          price: 1,
          categoryId: 1,
          startDate: 1,
          endDate: 1,
          image: 1,
          address: 1,
          venue: 1,
          organizer: 1,
          attendees: 1,
          category: 1,
          totalEnroll: { $size: "$attendees" },
          isFavorite: {
            $and: [{ $isArray: "$eventFavorite" }, { $in: [userId, "$eventFavorite"] }],
          },
        },
      },
    ]);
    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });

    return { status: 200, message: "Recomended list fetch", result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

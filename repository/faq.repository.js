const { search, statusSearch } = require("../helper/search");
const Model = require("../models/faq.model");
const { ObjectId } = require("mongoose").Types;
const errorHandler = require("../helper/errorHandler");
const { concatArrayFile, convertFieldsToAggregateObject, aggregateFileConcat } = require("../helper/index");

exports.findAllData = async (params) => {
  try {
    const {
      _id,
      addedBy,
      forId,
      FAQfor,
      status,
      keyword,
      authUser,
      limit = 10,
      offset = 0,
      searchValue,
      sortQuery = "ordering",
      selectValue = "question answers FAQfor for addedBy status ordering createdAt",
    } = params;
    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };

    if (status) query["status"] = statusSearch(status);
    if (addedBy) query["addedBy"] = addedBy;
    if (FAQfor) query["FAQfor"] = FAQfor;

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    if (forId) query["forId"] = ObjectId.isValid(forId) ? new ObjectId(forId) : undefined;

    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "forId",
          foreignField: "_id",
          as: "forUser",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { fullname: 1, image: 1, email: 1 } },
            { $set: { "image.url": aggregateFileConcat("$image.url") } },
          ],
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "forId",
          foreignField: "_id",
          as: "forServices",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { name: 1 } },
            concatArrayFile("gallery"),
          ],
        },
      },
      {
        $project: {
          ...selectProjectParams,
          for: {
            $cond: {
              if: { $eq: ["$forUser", []] },
              then: { $arrayElemAt: ["$forServices", 0] },
              else: { $arrayElemAt: ["$forUser", 0] },
            },
          },
        },
      },
      { $unwind: { path: "$answers", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "answers.answeredBy",
          foreignField: "_id",
          as: "answers.answeredBy",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { fullname: 1, isIdentifyVerified: 1 } },
          ],
        },
      },
      { $unwind: { path: "$answers", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          question: { $first: "$question" },
          ordering: { $first: "$ordering" },
          status: { $first: "$status" },
          addedBy: { $first: "$addedBy" },
          FAQfor: { $first: "$FAQfor" },
          for: { $first: "$for" },
          createdAt: { $first: "$createdAt" },
          answers: {
            $push: {
              $mergeObjects: [
                { $ifNull: ["$answers", {}] },
                {
                  answeredBy: {
                    _id: {
                      $ifNull: [{ $arrayElemAt: ["$answers.answeredBy._id", 0] }, null],
                    },
                    fullname: {
                      $ifNull: [{ $arrayElemAt: ["$answers.answeredBy.fullname", 0] }, null],
                    },
                    isIdentifyVerified: {
                      $ifNull: [{ $arrayElemAt: ["$answers.answeredBy.isIdentifyVerified", 0] }, null],
                    },
                  },
                  helpful: { $size: { $ifNull: ["$answers.helpfulId", []] } },
                  unhelpful: { $size: { $ifNull: ["$answers.unhelpfulId", []] } },
                  isHelpful: {
                    $in: [authUser?._id, { $ifNull: ["$answers.helpfulId", []] }],
                  },
                  isUnhelpful: {
                    $in: [authUser?._id, { $ifNull: ["$answers.unhelpfulId", []] }],
                  },
                },
              ],
            },
          },
        },
      },
      { $project: selectProjectParams },
      { $project: { "answers.helpfulId": 0, "answers.unhelpfulId": 0 } },
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
    if (result?.docs?.length == 0) return { status: 404, message: "Faq not found" };
    return { status: 200, message: "FAQ details fetched successfully", data: result.docs[0] };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.manage = async (params) => {
  try {
    if (params.id) {
      checkData = await Model.findOne({ _id: params.id, deletedAt: null });
      if (!checkData) return { status: 404, message: "FAQ not found" };
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
    const result = await this.findAllData({ _id: newData._id });

    if (result?.docs?.length == 0) return { status: 404, message: "Faq not found" };

    return {
      status: params.id ? 200 : 201,
      message: params.id ? "FAQ edited successfully" : "FAQ added successfully",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.helpfulUnhelpful = async (params) => {
  try {
    const { id, helpful = false, unhelpful = false, answerId, authUser } = params;
    let data = await Model.findById({ _id: id });

    if (!data) {
      return { status: 404, message: "Faq not found" };
    }

    const answerIndex = data.answers.findIndex((answer) => answer._id.toString() === answerId);

    if (answerIndex === -1) {
      return { status: 404, message: "Answer not found" };
    }

    const isHelpful = data.answers[answerIndex].helpfulId.includes(authUser._id);
    const isUnhelpful = data.answers[answerIndex].unhelpfulId.includes(authUser._id);

    const query = { _id: id, "answers._id": answerId };

    if (helpful) {
      const updateQuery = isHelpful
        ? { $pull: { "answers.$.helpfulId": authUser._id } }
        : { $addToSet: { "answers.$.helpfulId": authUser._id } };

      data = await Model.findOneAndUpdate(query, updateQuery, { new: true });
    }

    if (unhelpful) {
      const updateQuery = isUnhelpful
        ? { $pull: { "answers.$.unhelpfulId": authUser._id } }
        : { $addToSet: { "answers.$.unhelpfulId": authUser._id } };

      data = await Model.findOneAndUpdate(query, updateQuery, { new: true });
    }

    data = await this.findAllData({ _id: data._id });

    return { status: 200, message: "Success", data: data?.docs[0] };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.answer = async (params) => {
  try {
    if (params.id) {
      const checkData = await Model.findOne({ _id: params.id, deletedAt: null });
      if (!checkData) return { status: 404, message: "FAQ not found" };
    }

    const newData = await Model.findByIdAndUpdate(
      params.id,
      {
        $push: {
          answers: {
            answer: params.answer,
            answeredBy: params.userId ? params.userId : params.authUser._id,
          },
        },
      },
      { new: true }
    );

    if (!newData) {
      return { status: 404, message: "Faq not found" };
    }

    const result = await this.findAllData({ _id: newData._id });

    if (!result || !result.docs || result.docs.length === 0) {
      return { status: 404, message: "Faq not found" };
    }

    return { status: 200, message: "Success", data: result?.docs[0]?.answers[result?.docs[0]?.answers?.length - 1] };
  } catch (error) {
    return errorHandler(error, params);
  }
};

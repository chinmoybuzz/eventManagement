const { isNumber } = require("lodash");
const { search, statusSearch, arrayObjectIdSearch } = require("../helper/search.js");
const { Status, UserRole, USER_SHOW_FIELDS } = require("../helper/typeConfig");
const Model = require("../models/job.model.js");
const { ObjectId } = require("mongoose").Types;
const userModel = require("../models/user.model.js");
const errorHandler = require("../helper/errorHandler");
const { convertFieldsToAggregateObject, aggregateFileConcat, createSlug } = require("../helper/index.js");
const { uploadBinaryFile } = require("../utils/upload");
const jobTypeRepository = require("./jobType.repository.js");
const categoryRepository = require("./category.repository.js");
const { CategoryTypes } = require("../helper/typeConfig");
const { commonEmailThankYou } = require("../mails/sendEmail");

const findAllData = async (params) => {
  try {
    const {
      keyword,
      limit = 10,
      offset = 0,
      _id,
      status,
      featured = null,
      searchValue = false,
      selectValue = "description jobType category phoneNumber email title jobPosition jobVacancy createdAt expirationDate jobRequirement salary qualification Jobtype experience status company location ordering featured ",
      sortQuery = "ordering",
      category = null,
      jobType = null,
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query._id = new ObjectId(_id);

    if (status) query["status"] = statusSearch(status);
    if (featured) query["featured"] = statusSearch(featured);

    if (jobType) query.jobType = ObjectId.isValid(jobType) ? new ObjectId(jobType) : undefined;

    if (category) {
      query.category = arrayObjectIdSearch(category);
    }

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      searchQuery.push(
        "experience",
        "location.city",
        "location.address1",
        "location.address2",
        "location.country",
        "title",
        "jobRequirement"
      );
      const includesNumber = searchQuery.includes("experience", "salary");
      if (includesNumber) {
        if (!isNaN(keyword)) {
          query["salary"] = { $eq: parseInt(keyword) };
        } else {
          query.$or = search(searchQuery, keyword.trim());
        }
      }
    }
    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$deletedAt", null] }, { $eq: ["$type", CategoryTypes[0]] }],
                },
              },
            },
            {
              $project: {
                name: 1,
                type: 1,
                image: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "job_types",
          localField: "jobType",
          foreignField: "_id",
          as: "jobType",
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$deletedAt", null],
                },
              },
            },
            {
              $project: {
                title: 1,
              },
            },
          ],
        },
      },
      {
        $set: {
          jobType: { $arrayElemAt: ["$jobType", 0] },
        },
      },
      {
        $set: {
          category: {
            $map: {
              input: "$category",
              as: "categoryImage",
              in: {
                $mergeObjects: [
                  "$$categoryImage",
                  {
                    image: {
                      $mergeObjects: [
                        "$$categoryImage.image",
                        {
                          url: {
                            $concat: [process.env.BASE_URL, "$$categoryImage.image.url"],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },

      { $project: { ...selectProjectParams } },
    ]);

    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });

    return {
      status: 200,
      message: "list fetch",
      ...result,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

const details = async (params) => {
  try {
    const result = await findAllData({ _id: params.id });

    if (result?.docs?.length == 0) return { status: 404, message: "job not found" };

    return {
      status: 200,
      message: "Data fetch successfull",
      data: result.docs,
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

const manage = async (params) => {
  try {
    let checkDataRes;
    if (params.id) {
      checkDataRes = await details({ id: params.id });
      if (checkDataRes.status != 200) return checkDataRes;
    }
    params.fullname = params.authUser.fullname;
    if (!params.email) {
      params.email = params.authUser.email;
    }
    // Get All Category
    if (params.category && Array.isArray(params.category) && params.category.length > 0) {
      const checkCategoryRes = await categoryRepository.findAllData({
        _id: params.category,
        type: CategoryTypes[0],
        selectValue: "_id",
      });
      if (checkCategoryRes.status != 200) return checkCategoryRes;

      params.category = checkCategoryRes.docs.map((el) => el._id);
    } else delete params.category;

    // get job types
    if (params.jobType) {
      const jobTypeRes = await jobTypeRepository.list({
        _id: params.jobType,
      });
      if (jobTypeRes.status != 200) return jobTypeRes;
      params.jobType = jobTypeRes.result.docs[0]._id;
    } else delete params.jobType;

    // get all specializations
    if (Array.isArray(params.specialization) && params.specialization.length > 0) {
      const jobSpecializationRes = await jobSpecializationRepository.list({
        _id: params.specialization,
      });
      if (jobSpecializationRes.status != 200) return jobSpecializationRes;
      params.specialization = jobSpecializationRes.result.docs;
    } else delete params.specialization;

    if (!params.company) params.company = params.authUser?._id;

    if (params.title) params.slug = createSlug(params.title);

    let newData;
    if (params.id) {
      newData = await Model.findByIdAndUpdate(
        params.id,
        {
          ...params,
          updatedBy: params.authUser ? params.authUser._id : null,
        },
        { new: true }
      );
    } else {
      newData = await new Model({
        ...params,
        createdBy: params.authUser ? params.authUser._id : null,
      }).save();
    }
    const result = await details({ id: newData?._id });

    return {
      status: params.id ? 200 : 201,
      message: "Data saved",
      data: result.data[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

const manageFavorite = async (params) => {
  try {
    const checkData = await Model.findOne({
      _id: params.id,
      deletedAt: null,
    }).lean();

    if (!checkData) {
      return { status: 404, message: "Job Not Found" };
    }

    const userId = new ObjectId(params.authUser._id);
    const isUserSaved =
      Array.isArray(checkData.saved) && checkData.saved.some((id) => id.toString() === userId.toString());

    if (isUserSaved) {
      await Model.findOneAndUpdate({ _id: checkData._id }, { $pull: { saved: userId } }, { new: false });
      return { status: 200, message: "Job Unsaved" };
    } else {
      await Model.findOneAndUpdate({ _id: checkData._id }, { $addToSet: { saved: userId } }, { new: false });
      return { status: 200, message: "Job Saved" };
    }
  } catch (err) {
    return errorHandler(err, params);
  }
};

// when user apply
const apply = async (params) => {
  try {
    // Check Job

    const checkJob = await Model.aggregate([
      {
        $match: {
          _id: new ObjectId(params.jobAplicant.jobId),
          deletedAt: null,
          status: Status[0],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "Venderuser",
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }] } } },
            { $project: { fullname: 1, email: 1 } },
          ],
        },
      },
      {
        $unwind: "$Venderuser",
      },
      { $set: { Venderuser: "$Venderuser" } },
      {
        $project: {
          title: 1,
          Venderuser: 1,
        },
      },
    ]);

    if (checkJob.length == 0) return { status: 404, message: "Job Not Found" };
    // Check for apply
    const checkApply = await Model.findOne({
      jobAplicant: {
        $elemMatch: {
          userId: params.authUser._id,
        },
      },
      _id: params.jobAplicant.jobId,
      deletedAt: null,
    });
    if (checkApply) return { status: 400, message: "You have already applied to this job" };

    if (!params.cvFile) {
      return { status: 400, message: "CV is required" };
    } else {
      const up = await uploadBinaryFile({
        folder: "job-resume",
        file: params.cvFile,
      });
      params.cvFile = up;
    }

    await Model.findByIdAndUpdate(
      params.jobAplicant.jobId,
      {
        $push: {
          jobAplicant: {
            userId: params.authUser._id,
            cvFile: params.cvFile,
            message: params.message,
            status: Status[0],
            createdBy: params.authUser._id,
            updatedBy: params.authUser ? params.authUser._id : null,
          },
        },
      },
      { new: true }
    );

    await commonEmailThankYou(
      {
        user: {
          fullname: params.authUser.fullname,
        },
        message: params.jobAplicant.message,
        job: { title: checkJob[0].title },
        toMail: { email: params.authUser.email },
      },
      "JOB_APPLICATION_SUBMITED_FOR_USER"
    );
    await commonEmailThankYou(
      {
        job: { title: checkJob[0].title },
        user: {
          fullname: params.authUser.fullname,
          email: params.authUser.email,
        },

        cvFile: {
          ...params.cvFile,
          fileUrl: process.env.BASE_URL + params.cvFile.fileUrl,
        },
        applyDate: new Date(),
        message: params.message,
        toMail: { email: checkJob[0].Venderuser.email },
      },
      "JOB_APPLICATION_SUBMITED_FOR_ADMIN"
    );

    return {
      status: 201,
      message: "Application submited successfully",
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

const getUserDetails = async (params) => {
  try {
    const userDetail = await userModel
      .findOne({
        _id: params.id,
        deletedAt: null,
      })
      .select("email fullname");

    let data = { email: userDetail.email, fullname: userDetail.fullname };

    return data;
  } catch (error) {
    return errorHandler(error, params);
  }
};

const aplicantchangeStatus = async (params) => {
  try {
    const checkData = await aplicantdetails({ id: params.aplicantId });
    if (checkData.status !== 200) return checkData;

    await Model.findOneAndUpdate(
      { _id: params.id, "jobAplicant.userId": params.aplicantId }, // Replace with the actual userId
      { $set: { "jobAplicant.$.status": params.status } },
      { new: true }
    ).lean();

    const userDetails = await getUserDetails({ id: params.aplicantId });

    await commonEmailThankYou(
      {
        job: { title: checkData.data[0].title },
        company: checkData.data.job?.company,
        user: { fullname: userDetails.fullname },
        toMail: { email: userDetails.email },
        status: params.status,
      },
      "JOB_STATUS_CHANGE"
    );

    return { status: 200, message: "Status Changed" };
  } catch (err) {
    return errorHandler(err, params);
  }
};
//aplicant List
const aplicantfindAllData = async (params) => {
  try {
    const {
      keyword,
      limit = 10,
      offset = 0,
      _id,
      status,
      featured = null,
      searchValue = false,
      selectValue = "jobType jobAplicant category phoneNumber email title jobPosition jobVacancy createdAt expirationDate jobRequirement salary qualification Jobtype experience status company location ordering featured ",
      sortQuery = "ordering",
      category = null,
      jobType = null,
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query._id = new ObjectId(_id);

    if (status) query["status"] = statusSearch(status);
    if (featured) query["featured"] = statusSearch(featured);

    if (jobType) query.jobType = ObjectId.isValid(jobType) ? new ObjectId(jobType) : undefined;

    if (category) {
      query.category = arrayObjectIdSearch(category);
    }

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      searchQuery.push(
        "experience",
        "location.city",
        "location.address1",
        "location.address2",
        "location.country",
        "title",
        "jobRequirement"
      );
      const includesNumber = searchQuery.includes("experience", "salary");
      if (includesNumber) {
        if (!isNaN(keyword)) {
          query["salary"] = { $eq: parseInt(keyword) };
        } else {
          query.$or = search(searchQuery, keyword.trim());
        }
      }
    }
    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$deletedAt", null] }, { $eq: ["$type", CategoryTypes[0]] }],
                },
              },
            },
            {
              $project: {
                name: 1,
                type: 1,
                image: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "job_types",
          localField: "jobType",
          foreignField: "_id",
          as: "jobType",
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$deletedAt", null],
                },
              },
            },
            {
              $project: {
                title: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "jobAplicant.userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                fullname: 1,
              },
            },
          ],
        },
      },
      {
        $set: {
          jobAplicant: {
            $map: {
              input: "$jobAplicant",
              as: "aplicante",
              in: {
                $mergeObjects: [
                  "$$aplicante",
                  {
                    cvFile: {
                      $mergeObjects: [
                        "$$aplicante.cvFile",
                        {
                          url: {
                            $concat: [process.env.BASE_URL, "$$aplicante.cvFile.url"],
                          },
                        },
                      ],
                    },
                    user: { $arrayElemAt: ["$user", 0] },
                  },
                ],
              },
            },
          },
          category: {
            $map: {
              input: "$category",
              as: "categoryImage",
              in: {
                $mergeObjects: [
                  "$$categoryImage",
                  {
                    image: {
                      $mergeObjects: [
                        "$$categoryImage.image",
                        {
                          url: {
                            $concat: [process.env.BASE_URL, "$$categoryImage.image.url"],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $set: {
          jobType: { $arrayElemAt: ["$jobType", 0] }, // Use the same case for jobType
        },
      },
      { $project: { ...selectProjectParams } },
    ]);

    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });

    return {
      status: 200,
      message: "list fetch",
      ...result,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

const aplicantdetails = async (params) => {
  try {
    const {
      selectValue = "cvFile category message status createdAt jobType jobAplicant job  experience salary jobRequirement title",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");
    const myAggregate = Model.aggregate([
      {
        $match: {
          deletedAt: null,
          jobAplicant: {
            $elemMatch: { userId: new ObjectId(params.id) },
          },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$deletedAt", null] }, { $eq: ["$type", CategoryTypes[0]] }],
                },
              },
            },
            {
              $project: {
                name: 1,
                type: 1,
                image: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "job_types",
          localField: "jobType",
          foreignField: "_id",
          as: "jobType",
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$deletedAt", null],
                },
              },
            },
            {
              $project: {
                title: 1,
              },
            },
          ],
        },
      },
      {
        $set: {
          jobType: { $arrayElemAt: ["$jobType", 0] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "jobAplicant.userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                fullname: 1,
              },
            },
          ],
        },
      },
      {
        $set: {
          jobAplicant: {
            $map: {
              input: "$jobAplicant",
              as: "aplicante",
              in: {
                $mergeObjects: [
                  "$$aplicante",
                  {
                    cvFile: {
                      $mergeObjects: [
                        "$$aplicante.cvFile",
                        {
                          url: {
                            $concat: [process.env.BASE_URL, "$$aplicante.cvFile.url"],
                          },
                        },
                      ],
                    },
                    user: { $arrayElemAt: ["$user", 0] },
                  },
                ],
              },
            },
          },
          category: {
            $map: {
              input: "$category",
              as: "categoryImage",
              in: {
                $mergeObjects: [
                  "$$categoryImage",
                  {
                    image: {
                      $mergeObjects: [
                        "$$categoryImage.image",
                        {
                          url: {
                            $concat: [process.env.BASE_URL, "$$categoryImage.image.url"],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $project: { ...selectProjectParams } },
    ]);

    const checkData = await Model.aggregatePaginate(myAggregate);

    return { status: 200, message: "data found", data: checkData.docs };
  } catch (err) {
    return errorHandler(err, params);
  }
};
module.exports = {
  findAllData,
  details,
  manage,
  manageFavorite,
  apply,
  aplicantchangeStatus,
  aplicantfindAllData,
  aplicantdetails,
};

const { search, statusSearch } = require("../helper/search");
const { findAllData: findAuthor } = require("../repository/user.repository");
const Model = require("../models/post.model");
const userModel = require("../models/user.model");
const { ObjectId } = require("mongoose").Types;
const slugify = require("slugify");
const errorHandler = require("../helper/errorHandler");
const { convertFieldsToAggregateObject, fileConcat, concatArrayFile } = require("../helper/index");
const { USER_SHOW_FIELDS } = require("../helper/typeConfig");
const { uploadBinaryFile, deleteFile } = require("../utils/upload");
const { isValidObjectId } = require("mongoose");

exports.findAllData = async (params) => {
  try {
    const {
      status,
      keyword,
      _id = "",
      limit = 10,
      offset = 0,
      author = "",
      featured = null,
      categoryId = null,
      searchValue = false,
      sortQuery = "ordering",
      selectValue = "title slug image gallery shortDescription description featured publishDate category author status ordering createdAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };

    if (status) query["status"] = statusSearch(status);

    if (featured) query["featured"] = parseInt(featured);

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    if (Array.isArray(author) && author.length > 0) {
      let ids = author.map((el) => (isValidObjectId(el) ? new ObjectId(el) : null)).filter(Boolean);
      query["author"] = { $in: ids };
    } else if (author) {
      query["author"] = isValidObjectId(author) ? new ObjectId(author) : null;
    }

    if (categoryId) query["categoryId"] = new ObjectId(categoryId);

    if (params.startDate && params.startDate != "null" && params.endDate && params.endDate != "null") {
      query.publishDate = {
        $gte: new Date(params.startDate),
        $lte: new Date(params.endDate),
      };
    }
    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }
    let userId = null;
    if (params.authUser) userId = new ObjectId(params.authUser._id);
    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
          pipeline: [
            { $match: { $expr: { $eq: ["$deletedAt", null] } } },
            {
              $project: {
                name: 1,
                status: 1,
                createdAt: 1,
                image: { $concat: [process.env.BASE_URL, "$image.url"] },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [{ $match: { $expr: { $eq: ["$deletedAt", null] } } }, { $project: USER_SHOW_FIELDS }],
        },
      },
      {
        $set: {
          author: { $arrayElemAt: ["$author", 0] },
          image: {
            url: {
              $cond: {
                if: { $eq: ["$image.url", null] },
                then: null,
                else: {
                  $concat: [process.env.BASE_URL, "$image.url"],
                },
              },
            },
          },
        },
      },
      concatArrayFile("gallery"),
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

exports.details = async (params) => {
  try {
    let query = { deletedAt: null };
    if (isValidObjectId(params.id)) {
      query._id = params.id;
    } else {
      query.slug = params.id;
    }
    const data = await this.findAllData(query);

    if (data.length == 0) return { status: 404, message: "Post not found" };
    return { status: 200, message: "Data fetch successfull", data: data.docs };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.manage = async (params) => {
  try {
    let checkData = null;
    if (params.id) {
      checkData = await Model.findOne({ _id: params.id, deletedAt: null });
      if (!checkData) return { status: 404, message: "Data not found" };
    }
    if (params.image.length > 0) {
      if (checkData && checkData.image) deleteFile(checkData.image);
      const imageData = await uploadBinaryFile({
        folder: "post",
        file: params.image[0],
      });
      params.image = imageData;
    } else {
      params.image = checkData && checkData.image ? checkData.image : null;
    }

    let galleryArr = [];
    if (Array.isArray(params.gallery) && params.gallery.length > 0) {
      for (let file of params.gallery) {
        const up = await uploadBinaryFile({ folder: "post", file });
        if (up?.url) galleryArr.push(up);
      }
      params.gallery = galleryArr;
    } else delete params.gallery;

    if (!params.author) params.author = params.authUser._id;

    if (params.slug) {
      params.slug = slugify(params.slug.toLowerCase());
    } else if (params.title) {
      params.slug = slugify(params.title.toLowerCase());
    }

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
      newData = await new Model({
        ...params,

        createdBy: params.authUser ? params.authUser._id : null,
      }).save();
    }

    const result = await this.details({ id: newData?._id });
    return {
      status: params.id ? 200 : 201,
      message: "Data saved",
      data: result.data,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.authors = async (params) => {
  try {
    const posts = await Model.find({ deletedAt: null });

    if (posts.length == 0) return { status: 400, message: "Author not found" };

    let authors = posts.map((post) => post.author);
    const data = await findAuthor({ _id: authors, selectValue: "fullname" });
    return {
      status: 200,
      message: "Author list fetched successfully",
      docs: data.docs,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.manageFavorite = async (params) => {
  try {
    const checkData = await Model.findOne({
      _id: params.postId,
      deletedAt: null,
    }).lean();
    if (!checkData) return { status: 404, message: "Post Not Found" };
    let userId = new ObjectId(params.authUser._id);
    checkData.postFavorite = checkData.postFavorite.map((id) => id.toString());
    const index = checkData.postFavorite.indexOf(userId.toString());

    if (index == -1) {
      await Model.findOneAndUpdate(
        { _id: checkData._id },
        { $addToSet: { postFavorite: params.authUser._id } },
        { new: false }
      );
    } else {
      await Model.findOneAndUpdate(
        { _id: checkData._id },
        { $pull: { postFavorite: { $eq: userId } } },
        { new: false }
      );
    }
    return { status: 200, message: "favorite change" };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.postFrontList = async (params) => {
  try {
    const {
      keyword,
      limit = 10,
      offset = 0,
      status,
      searchValue = false,
      selectValue = "title slug image shortDescription publishDate category categoryId author status createdAt postFavorite",
      sortQuery = "ordering",
      categoryId = null,
      publishDate,
      author = null,
      _id = "",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let userId = null;
    if (params.authUser) userId = new ObjectId(params.authUser._id);
    let query = { deletedAt: null, status: 1 };

    const userList = await userModel.aggregate([
      {
        $match: { userFavorite: { $eq: userId }, deletedAt: null },
      },
    ]);

    const postFavoriteCategoryList = await Model.aggregate([
      {
        $match: { postFavorite: { $eq: userId }, deletedAt: null, status: 1 },
      },
      {
        $project: {
          categoryId: 1,
        },
      },
      {
        $unwind: "$categoryId",
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
    const postUnFavoriteCategoryList = await Model.aggregate([
      {
        $match: {
          categoryId: {
            $nin: postFavoriteCategoryList[0]?.categoryArray || [],
          },
        },
      },
      {
        $project: {
          categoryId: 1,
        },
      },
      {
        $unwind: "$categoryId",
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
    if (categoryId) query["categoryId"] = new ObjectId(categoryId);
    if (params.startDate && params.startDate != "null" && params.endDate && params.endDate != "null") {
      query.createdAt = {
        $gte: new Date(params.startDate),
        $lte: new Date(params.endDate),
      };
    } else {
      query.publishDate = {
        $lte: new Date(),
      };
    }

    // if (params.categoryId) {
    //   query.$and = [
    //     { categoryId: { $eq: new ObjectId(params.categoryId) } },
    //     {
    //       postFavorite: { $eq: userId },
    //     },
    //   ];
    // } else {
    //   if (params?.authUser?._id) {
    query.$or = [
      {
        categoryId: {
          $in: postFavoriteCategoryList[0]?.categoryArray || [],
        },
      },
      {
        categoryId: {
          $in: postUnFavoriteCategoryList[0]?.categoryArray || [],
        },
      },
    ];
    // }
    //}

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }
    const myAggregate = Model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
          pipeline: [
            { $match: { $expr: { $eq: ["$deletedAt", null] } } },
            {
              $project: {
                name: 1,
                status: 1,
                createdAt: 1,
                image: fileConcat("$image"),
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [{ $match: { $expr: { $eq: ["$deletedAt", null] } } }, { $project: USER_SHOW_FIELDS }],
        },
      },
      {
        $set: {
          author: { $arrayElemAt: ["$author", 0] },
          image: fileConcat("$image"),
        },
      },
      {
        $project: {
          ...selectProjectParams,
          isPriorityCategory: 1,
          totalLike: { $size: "$postFavorite" },
          isLiked: { $in: [userId, "$postFavorite"] },
        },
      },
      // {
      //   $addFields: {
      //     isPriorityCategory: {
      //       $cond: {
      //         if: {
      //           $gt: [
      //             {
      //               $size: {
      //                 $setIntersection: [
      //                   "$categoryId",
      //                   postFavoriteCategoryList[0]?.categoryArray,
      //                 ],
      //               },
      //             },
      //             0,
      //           ],
      //         },
      //         then: 1,
      //         else: 0,
      //       },
      //     },
      //   },
      // },
      {
        $addFields: {
          isPriorityCategory: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: {
                      $setIntersection: [
                        "$categoryId",
                        {
                          $ifNull: [postFavoriteCategoryList[0]?.categoryArray, []],
                        },
                      ],
                    },
                  },
                  0,
                ],
              },
              then: 1,
              else: 0,
            },
          },
        },
      },

      {
        $sort: {
          isPriorityCategory: -1,
        },
      },
      // {
      //   $project: {
      //     isPriorityCategory: 0,
      //   },
      // },
    ]);
    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      // sort: sortQuery,
    });
    return { status: 200, message: "list fetch", result };
  } catch (error) {
    return errorHandler(error, params);
  }
};

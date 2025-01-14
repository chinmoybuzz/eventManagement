const { search, statusSearch } = require("../helper/search");
const Model = require("../models/page.model");
const { ObjectId } = require("mongoose").Types;
const { convertFieldsToAggregateObject, createSlug, aggregateFileConcat } = require("../helper/index.js");
const { uploadBinaryFile } = require("../utils/upload.js");
const errorHandler = require("../helper/errorHandler.js");

exports.findAllData = async (params) => {
  try {
    const {
      keyword,
      limit = 10,
      offset = 0,
      status,
      searchValue = "title,description,content,slug",
      selectValue = "title slug seo image content status banner sections createdAt ordering description name",
      sortQuery = "-ordering",
      _id = null,
      slug = null,
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    const selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    if (status) query["status"] = statusSearch(status);
    if (slug) query["slug"] = params.slug;
    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query._id = new ObjectId(_id);

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      query.$or = search(searchQuery, keyword);
    }

    const myAggregate = Model.aggregate([
      { $match: query },
      { $set: { "image.url": aggregateFileConcat("$image.url") } },
      {
        $set: {
          banner: {
            $map: {
              input: "$banner",
              as: "bannerItem",
              in: {
                $mergeObjects: [
                  "$$bannerItem",
                  {
                    image: {
                      $mergeObjects: [
                        "$bannerItem.image",
                        { url: { $concat: [process.env.BASE_URL, "$$bannerItem.image.url"] } },
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
        $project: {
          ...selectProjectParams,
          sections: { $sortArray: { input: "$sections", sortBy: { ordering: 1 } } },
        },
      },
    ]);

    const data = await Model.aggregatePaginate(myAggregate, { offset, limit, sort: sortQuery });
    return { status: 200, message: "Page list fetched successfully", ...data };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.details = async (params) => {
  try {
    const { id, slug } = params;
    let query = { deletedAt: null };
    if (id) query._id = params.id;
    if (slug) query.slug = slug;
    const result = await this.findAllData(query);
    if (result?.docs?.length == 0) return { status: 404, message: "Page data not found" };
    return { status: 200, message: `${result?.docs[0]?.name} page details fetched successfully`, data: result.docs[0] };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.manage = async (params) => {
  try {
    let checkDatabanner = [];
    if (params.id) {
      const checkData = await Model.findOne({ _id: params.id });
      checkDatabanner = checkData.banner;
      if (!checkData) return { status: 404, message: "Page data not found" };
    }

    if (params.image.length > 0) {
      const up = await uploadBinaryFile({
        folder: "page",
        file: params.image[0],
      });
      params.image = up;
    } else delete params.image;

    const bannerImages = [];
    if (Array.isArray(params.banner) || params.bannerImg) {
      for (let fileimage of params.bannerImg) {
        const up = await uploadBinaryFile({ file: fileimage, folder: "page" });
        bannerImages.push(up);
      }
    }

    let temp = [];
    if (Array.isArray(params.banner) || params.bannerImg) {
      temp = params.banner.map((item, i) => {
        return { ...item, image: bannerImages[i], ordering: i };
      });
    }

    if (params.name) {
      let slug = createSlug(params.name);
      slug = slug.split("-");
      if (slug.length > 1) {
        slug.pop();
        slug = slug.join("-");
      }
      params.slug = slug;
    }
    params.banner = params.banner ? temp : checkDatabanner;
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

    const result = await this.findAllData({ _id: newData?._id });
    return {
      status: params.id ? 200 : 201,
      message: params.id ? "Data successfully updated." : " Data successfully added.",
      data: result.docs[0],
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

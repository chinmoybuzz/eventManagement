const Model = require("../models/siteSetting.model");
const Social = require("../models/socialMedias.model");
const { uploadBinaryFile, deleteFile } = require("../utils/upload");
const errorHandler = require("../helper/errorHandler");
const { aggregateFileConcat } = require("../helper");

exports.findOneData = async (params = {}) => {
  try {
    const data = await Model.aggregate([
      { $match: { deletedAt: null } },
      { $set: { "logo.url": aggregateFileConcat("$logo.url") } },
      { $set: { "favicon.url": aggregateFileConcat("$favicon.url") } },
    ]);
    if (data.length === 0) data[0] = await new Model({}).save();
    return { status: 200, message: "Site settings fetched successfully", data: data[0] };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.edit = async (params) => {
  try {
    let socialArr = [];
    const checkData = await Model.findOne({ deletedAt: null });
    if (!checkData) {
      await new Model({}).save();
    }
    if (params.logo) {
      if (checkData && checkData?.logo?.url) deleteFile(checkData?.logo?.url);

      const up = await uploadBinaryFile({
        file: params.logo,
        folder: "site_setting",
      });
      params.logo = up;
    } else delete params.logo;

    if (params.favicon) {
      if (checkData && checkData?.favicon?.url) deleteFile(checkData?.favicon?.url);
      const up = await uploadBinaryFile({ file: params.favicon, folder: "site_setting" });
      params.favicon = up;
    } else delete params.favicon;

    if (params.social && params.social.length > 0) {
      const siteSettingSocial = params.social;
      const dbSocial = await Social.find({ deletedAt: null });
      socialArr = siteSettingSocial.map((siteSettingSocialItem) => {
        const matchedArray = dbSocial.find((dbSocialItem) => dbSocialItem?._doc.code === siteSettingSocialItem.code);
        const { _id, ...dataArray } = matchedArray?._doc;
        return { ...siteSettingSocialItem, ...dataArray };
      });
    }
    if (socialArr.length > 0) params.social = socialArr;

    if (params.referralCommission) params.referralCommission = parseInt(params.referralCommission);
    if (params.isUnderConstruction == "true") params.isUnderConstruction = true;

    await Model.findOneAndUpdate(
      { deletedAt: null },
      { ...params, updatedBy: params.authUser ? params.authUser._id : null },
      { new: true }
    );

    const result = await this.findOneData({ deletedAt: null });
    return {
      status: 200,
      message: "Data successfully updated.",
      data: result.data,
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

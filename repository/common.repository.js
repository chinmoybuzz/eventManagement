const errorHandler = require("../helper/errorHandler");
const { ObjectId } = require("mongoose").Types;

exports.remove = async (params) => {
  try {
    params.id = params.id ? params.id : params.ids || null;
    const Model = require(`../models/${params.model}.model`);
    if (Array.isArray(params.id)) {
      await Model.updateMany(
        { _id: { $in: params.id }, deletedAt: null },
        { deletedAt: new Date(), deletedBy: params.authUser ? params.authUser._id : null }
      );
    } else {
      const del = await Model.updateOne(
        { _id: params.id, deletedAt: null },
        { $set: { deletedAt: new Date(), deletedBy: params.authUser ? params.authUser._id : null } }
      );
      if (del.modifiedCount == 0) return { status: 404, message: "Data not found" };
    }
    return { status: 200, message: "Data deleted successfully" };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.changeStatus = async (params) => {
  try {
    params.id = params.id ? params.id : params.ids || null;
    statusChange = await require(`../models/${params.model}.model`).updateMany(
      { _id: { $in: params.id }, deletedAt: null },
      { ...params, updatedBy: params.authUser ? params.authUser._id : null }
    );
    if (statusChange.modifiedCount === 0) {
      return { status: 404, message: "Data not found" };
    }
    return { status: 200, message: "Status changed successfully" };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.saveOrdering = async (params) => {
  try {
    params.data = params.data ? params.data : params.ordering_data || null;
    let saveOrdering;
    for (let element of params.data) {
      saveOrdering = await require(`../models/${params.model}.model`).findOneAndUpdate(
        { _id: element.id },
        { ordering: element.ordering }
      );
    }
    if (saveOrdering?.modifiedCount === 0) {
      return { status: 404, message: "Data not found" };
    }
    return { status: 200, message: "Ordering changed successfully" };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.deleteFileFromArray = async (params) => {
  try {
    const { id, path, fileId, model } = params;
    const fileIdsArray = Array.isArray(fileId) ? fileId : [fileId];

    await require(`../models/${model}.model`).updateMany(
      { _id: new ObjectId(id) },
      { $pull: { [path]: { _id: { $in: fileIdsArray.map((id) => new ObjectId(id)) } } } }
    );
    let filePath;
    if (/[A-Z]/.test(path) && /\./.test(path)) {
      // Split the string on "." and capital letter
      let splitString = path.split(/\.|(?=[A-Z])/);

      // Remove empty strings from the array
      splitString = splitString.filter(function (str) {
        return str !== "";
      });

      // Capitalize the first letter of each word
      splitString = splitString.map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      });

      // Join the array back into a string using " "
      filePath = splitString.join(" ");
    } else if (path.includes(".")) {
      let splitString = path.split(".");

      splitString[0] = splitString[0].charAt(0).toUpperCase() + splitString[0].slice(1);

      filePath = splitString.join(" ");
    } else {
      let splitString = path.split(/(?=[A-Z])/);

      splitString[0] = splitString[0].charAt(0).toUpperCase() + splitString[0].slice(1);

      filePath = splitString.join(" ");
    }
    return { status: 200, message: filePath + " file deleted successfully" };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.changeFeatured = async (params) => {
  try {
    params.id = params.id ? params.id : params.ids || null;
    changeFeatured = await require(`../models/${params.model}.model`).updateMany(
      { _id: { $in: params.id }, deletedAt: null },
      { ...params, updatedBy: params.authUser ? params.authUser._id : null }
    );
    if (changeFeatured.modifiedCount === 0) {
      return { status: 404, message: "Data not found" };
    }
    return { status: 200, message: "Featured changed successfully" };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.saveOrderingOfArray = async (params) => {
  try {
    params.data = params.data ? params.data : params.ordering_data || null;
    params.data.forEach(async (element) => {
      await require(`../models/${params.model}.model`).findOneAndUpdate(
        { [`${params.path}._id`]: element.id },
        { $set: { [`${params.path}.$.ordering`]: element.ordering } }
      );
    });
    return { status: 200, message: "Ordering changed successfully" };
  } catch (error) {
    return errorHandler(error, params);
  }
};

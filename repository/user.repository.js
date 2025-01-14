const { search, statusSearch } = require("../helper/search");
const Model = require("../models/user.model");
const Social = require("../models/socialMedias.model");
const { ObjectId } = require("mongoose").Types;
const errorHandler = require("../helper/errorHandler");
const {
  convertFieldsToAggregateObject,
  createHashPassword,
  validatePassword,
  aggregateFileConcat,
  concatArrayFile,
  dateDiffInDays,
} = require("../helper/index");
const { uploadBinaryFile, deleteFile } = require("../utils/upload");

exports.findAllData = async (params) => {
  try {
    const {
      _id = "",
      status,
      rating,
      keyword,
      isVendor,
      username,
      isFeatured,
      isTopVendor,
      minHourlyRate,
      maxHourlyRate,
      offset = 0,
      limit = 10,
      categoryId = "",
      roleCode,
      emailVerified,
      PortfolioImageStatus,
      searchValue = "fullname.firstName, fullname.lastName, email, platform, address.city, address.address1, address.state, address.country, categories.name, username",
      selectValue = "fullname username isVendor roleCode email image gender emailVerified emailVerifiedAt status address social about skills hourlyRate rating categories dateOfBirth phone isFeatured isIdentifyVerified isMembershipVerified isPreferredVendor isTopVendor isPhoneVerified paymentAccepted terms openTime createdAt favouriteVendors meeting",
      sortQuery = "-createdAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    let selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    let optionalQuery = { deleteAt: null };

    if (rating) optionalQuery.rating = { $gte: parseInt(params.rating) };
    if (minHourlyRate && maxHourlyRate) {
      optionalQuery.hourlyRate = { $gte: parseInt(params.minHourlyRate), $lte: parseInt(params.maxHourlyRate) };
    }
    if (minHourlyRate && !maxHourlyRate) optionalQuery.hourlyRate = { $gte: parseInt(params.minHourlyRate) };
    if (maxHourlyRate && !minHourlyRate) optionalQuery.hourlyRate = { $lte: parseInt(params.maxHourlyRate) };

    if (status) query.status = statusSearch(status);
    // if (gender) query.gender = gender;
    // if (username) query.username = username;
    // if (dateOfBirth) query.dateOfBirth = dateOfBirth;
    // if (lastName) query.fullname["lastName"] = lastName;
    // if (firstName) query.fullname["firstName"] = firstName;
    if (emailVerified) query.emailVerified = statusSearch(emailVerified);

    if (roleCode) query.roleCode = roleCode.toLowerCase();
    if (username) query.username = username;
    if (isVendor && isVendor === ("true" || true)) query.isVendor = true;
    if (isTopVendor && isTopVendor === ("true" || true)) query.isTopVendor = true;
    if (isTopVendor && isTopVendor === "false") query.isTopVendor = false;
    if (isFeatured) query.isFeatured = parseInt(isFeatured);

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    if (Array.isArray(categoryId) && categoryId.length > 0) {
      let ids = categoryId.map((el) => new ObjectId(el));
      query["categoryId"] = { $in: ids };
    } else if (categoryId) query["categoryId"] = new ObjectId(categoryId);

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      optionalQuery.$or = search(searchQuery, keyword);
      if (keyword.includes(" ")) {
        optionalQuery.$or.push({
          $and: [
            { "fullname.firstName": { $regex: keyword.split(" ")[0], $options: "i" } },
            { "fullname.lastName": { $regex: keyword.split(" ")[1], $options: "i" } },
          ],
        });
      }
    }

    if (PortfolioImageStatus) {
      selectProjectParams.portfolioImage = {
        $filter: {
          input: { $sortArray: { input: "$portfolioImage", sortBy: { ordering: 1 } } },
          as: "sortedPortfolioImage",
          cond: { $eq: ["$$sortedPortfolioImage.status", PortfolioImageStatus] },
        },
      };
    } else {
      selectProjectParams.portfolioImage = {
        $sortArray: { input: "$portfolioImage", sortBy: { ordering: 1 } },
      };
    }

    const myAggregate = Model.aggregate([
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
          from: "reviews",
          let: { user: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }, { $eq: ["$vendorId", "$$user"] }] } } },
            { $group: { _id: "$vendorId", averageRating: { $avg: "$rating" } } },
            { $project: { _id: 1, averageRating: 1 } },
          ],
          as: "review",
        },
      },
      { $set: { "image.url": aggregateFileConcat("$image.url") } },
      concatArrayFile("portfolioImage"),
      { $unwind: { path: "$review", preserveNullAndEmptyArrays: true } },
      { $project: { ...selectProjectParams, rating: "$review.averageRating" } },
      { $match: optionalQuery },
    ]);

    const result = await Model.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });

    return {
      status: 200,
      message: "User list fetched successfully",
      ...result,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.findOneData = async (params) => {
  try {
    let query = { daletedAt: null };
    if (params.id) query["_id"] = params.id;
    if (params.PortfolioImageStatus) query["PortfolioImageStatus"] = parseInt(params.PortfolioImageStatus);
    const result = await this.findAllData(query);
    if (result?.docs.length == 0) return { status: 404, message: "User not found" };
    return {
      status: 200,
      message: "User details fetched successfully",
      data: result.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.manage = async (params) => {
  try {
    let checkData;
    let portfolioImageOrder = 0;
    if (params.id) {
      checkData = await Model.findOne({ _id: params.id, deletedAt: null });
      if (!checkData) return { status: 404, message: "User not found" };
      const portfolioImageList = checkData.portfolioImage;
      portfolioImageOrder = portfolioImageList.length + portfolioImageOrder;
    }

    let role;
    if (params.roleCode) {
      params.roleCode = params.roleCode.toLowerCase();
      role = params.roleCode.charAt(0).toUpperCase() + params.roleCode.slice(1);
    } else role = "User";

    if (params.password !== params.confirmPassword) {
      return {
        status: 400,
        message: "Password & confirm password did not matched",
      };
    }

    if (params.password && params.password.trim() !== "" && !params.password.includes(" ")) {
      if (!validatePassword(params.password)) {
        return {
          status: 400,
          message:
            "Password must have at least eight characters, one capital letter, one small letter, one number, and one symbol, and should not contain spaces.",
        };
      }

      params.password = createHashPassword(params.password);
    } else {
      delete params?.password;
    }

    if (params.image.length > 0) {
      if (checkData && checkData?.image?.url) deleteFile(checkData?.image?.url);
      const up = await uploadBinaryFile({ file: params.image[0], folder: "user" });
      params.image = up;
    } else delete params.image;

    let portfolioImageArr = [];
    if (Array.isArray(params.portfolioImage) && params.portfolioImage.length > 0) {
      for (let file of params.portfolioImage) {
        const up = await uploadBinaryFile({ folder: "user", file });
        if (up?.url) portfolioImageArr.push({ ...up, ordering: portfolioImageOrder++ });
      }
      params.portfolioImage = portfolioImageArr;
    } else delete params.portfolioImage;

    if (params.hourlyRate) params.hourlyRate = parseInt(params.hourlyRate);

    if (params.isIdentifyVerified)
      params.isIdentifyVerified == "true" ? (params.isIdentifyVerified = true) : (params.isIdentifyVerified = false);

    if (params.isMembershipVerified)
      params.isMembershipVerified == "true"
        ? (params.isMembershipVerified = true)
        : (params.isMembershipVerified = false);

    if (params.isPreferredVendor)
      params.isPreferredVendor == "true" ? (params.isPreferredVendor = true) : (params.isPreferredVendor = false);

    if (params.isPhoneVerified)
      params.isPhoneVerified == "true" ? (params.isPhoneVerified = true) : (params.isPhoneVerified = false);

    if (params.isTopVendor) params.isTopVendor == "true" ? (params.isTopVendor = true) : (params.isTopVendor = false);

    let socialArr = [];

    if (params.social && params.social.length > 0) {
      const userSocial = params.social;
      const dbSocial = await Social.find({ deletedAt: null });
      socialArr = userSocial.map((userSocialItem) => {
        const matchedArray = dbSocial.find((dbSocialItem) => dbSocialItem?._doc.code === userSocialItem.code);
        const { _id, ...dataArray } = matchedArray?._doc;
        return { ...userSocialItem, ...dataArray };
      });
    }
    if (socialArr.length > 0) params.social = socialArr;
    let newData;
    if (params.id) {
      if (Array.isArray(params.portfolioImage) && params.portfolioImage.length > 0) delete params.portfolioImage;

      newData = await Model.findByIdAndUpdate(
        params.id,
        { ...params, updatedBy: params.authUser ? params.authUser._id : null },
        { new: true }
      );

      newData = await Model.findOneAndUpdate(
        { _id: params?.id },
        { $push: { portfolioImage: { $each: portfolioImageArr } } },
        { new: true }
      );
    } else {
      newData = await new Model({
        ...params,
        createdBy: params.authUser ? params.authUser._id : null,
      }).save();
    }
    const result = await this.findOneData({ id: newData?._id });
    return {
      status: params.id ? 200 : 201,
      message: params.id ? `${role} updated successfully` : `${role} added successfully`,
      data: result.data,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.username = async (params) => {
  try {
    let { fullname, username } = params;
    const { firstName, lastName } = fullname;

    if (username) username = username.toLowerCase();

    if (!username) return { status: 400, message: "Please enter a username" };

    if (username.length < 3)
      return {
        status: 400,
        message: "Username must be at least 3 characters long",
      };

    const users = await Model.find().select("username -_id");
    const existingUsernameArray = users.filter((obj) => obj.username).map((obj) => obj.username);

    if (!existingUsernameArray.includes(username))
      return {
        status: 202, // Accepted
        isUsernameAvailable: true,
        message: "Username is available",
      };

    function getRandomNumber(usedNumbers) {
      let randomNumber;
      do {
        randomNumber = Math.floor(Math.random() * 1000000); // Adjust the range as needed
      } while (usedNumbers.includes(randomNumber));
      usedNumbers.push(randomNumber);
      return randomNumber;
    }

    function generateUsernames() {
      const usernames = [];
      const usedDotNumbers = [];
      const usedUnderscoreNumbers = [];

      // Generate username variations
      const variations = [
        `${firstName}.${lastName}`,
        `${firstName}_${lastName}`,
        `${firstName.toLowerCase()}${lastName.toLowerCase()}@partyfixer.com`,
      ];

      // Add unique variations to the array
      variations.forEach((username) => {
        if (!existingUsernameArray.includes(username) && !usernames.includes(username)) {
          usernames.push(username);
        }
      });

      // Add unique variations with random numbers at the end
      while (usernames.length < 5) {
        const dottedRandomNumber = getRandomNumber(usedDotNumbers);
        const underscoredRandomNumber = getRandomNumber(usedUnderscoreNumbers);

        const dottedUsername = `${firstName}.${lastName}${dottedRandomNumber}`;
        const underscoredUsername = `${firstName}_${lastName}${underscoredRandomNumber}`;

        if (!existingUsernameArray.includes(dottedUsername) && !usernames.includes(dottedUsername)) {
          usernames.push(dottedUsername);
        }

        if (!existingUsernameArray.includes(underscoredUsername) && !usernames.includes(underscoredUsername)) {
          usernames.push(underscoredUsername);
        }
      }

      return usernames.slice(0, 5); // Return only the first 5 unique usernames
    }

    const data = generateUsernames(firstName, lastName, existingUsernameArray);
    return {
      status: 201, // Created
      isUsernameAvailable: false,
      message: "Username isn't available, please select one or try others",
      data,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.deleteSocial = async (params) => {
  try {
    const { id, socialId } = params;
    const user = await Model.findOneAndUpdate(
      { _id: id, "social._id": socialId },
      { $pull: { social: { _id: socialId } } }
    );
    const data = await this.findAllData({ _id: user._id });
    return { status: 200, message: "Social deleted successfully", data };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.portfolioImageStatusChange = async (params) => {
  try {
    const { status, portfolioImageId } = params;
    const user = await Model.findOneAndUpdate(
      { "portfolioImage._id": { $in: portfolioImageId } },
      { $set: { "portfolioImage.$.status": status } }
    );
    const data = await this.findAllData({ _id: user._id });
    return {
      status: 200,
      message: "Portfolio image status changed successfully",
      data: data.docs[0],
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.portfolioImageOrdering = async (params) => {
  try {
    params.data = params.data ? params.data : params.ordering_data || null;
    params.data.forEach(async (element) => {
      await Model.findOneAndUpdate(
        { "portfolioImage._id": element.id },
        { $set: { "portfolioImage.$.ordering": element.ordering } }
      );
    });
    return { status: 200, message: "Ordering changed successfully" };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.manageFavorite = async (params) => {
  try {
    const checkData = await Model.findOne({ _id: params.authUser._id, deletedAt: null });
    if (!checkData) return { status: 404, message: "User Not Found" };
    checkData.favouriteVendors = checkData.favouriteVendors.map((id) => id.toString());
    const index = checkData.favouriteVendors.indexOf(params.id.toString());

    if (index === -1) {
      await Model.findOneAndUpdate(
        { _id: checkData._id },
        { $addToSet: { favouriteVendors: params.id } },
        { new: false }
      );
      return { status: 200, message: "Vendor marked as favorite successfully" };
    } else {
      await Model.findOneAndUpdate(
        { _id: checkData._id },
        { $pull: { favouriteVendors: { $eq: params.id } } },
        { new: false }
      );
      return { status: 200, message: "Vendor marked as unfavorite successfully" };
    }
  } catch (err) {
    return errorHandler(err, params);
  }
};

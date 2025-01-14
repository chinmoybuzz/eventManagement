const data = require("date-fns");
const { ObjectId } = require("mongoose").Types;
function isISODateValid(date) {
  return data.isValid(date);
}

const search = (keys, keyword) => {
  const escapedSearchTerm = keyword.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let searchData = [];
  keys.filter((it) => {
    if (typeof it === "string") {
      searchData.push({
        $and: [{ [it]: { $regex: escapedSearchTerm, $options: "i" } }],
      });
    }
  });
  return searchData;
};

const statusSearch = (status) => {
  if (Array.isArray(status)) {
    let resultStatus = status.map((i) => Number(i));
    return { $in: resultStatus };
  } else {
    return parseInt(status);
  }
};

const arrayObjectIdSearch = (elements) => {
  if (!Array.isArray(elements)) {
    return { $elemMatch: { $eq: new ObjectId(elements) } };
  } else {
    let res = elements.map((el) => new ObjectId(el));
    return { $elemMatch: { $in: res } };
  }
};

const dateSearch = (keys, keyword) => {
  // Check if the keyword is a string
  if (typeof keyword !== "string") {
    // Handle the case where the keyword is not a string
    return [];
  }

  const escapedSearchTerm = keyword.replace(/[-:.TZ]/g, "\\$&");
  let searchData = [];

  keys.forEach((key) => {
    if (typeof key === "number") {
      const query = {};
      query[key] = {
        $regex: escapedSearchTerm,
        $options: "i",
      };
      searchData.push(query);
    }
  });
  return searchData;
};

module.exports = {
  search,
  statusSearch,
  arrayObjectIdSearch,
  dateSearch,
};

const { fileConcat } = require(".");
const { CategoryTypes } = require("./typeConfig");




const UserAggregationLookup = ({
  localField,
  foreignField,
  alias = "user",
  project = {},
  match = [],
  pipeline = [],
}) => {
  const aggPipeline = [];
  aggPipeline.push({
    $match: {
      $expr: { $and: [...match, { $eq: ["$deletedAt", null] }] },
    },
  });

  if (pipeline.length > 0) for (let item of pipeline) aggPipeline.push(item);

  if (Object.entries(project).length > 0)
    aggPipeline.push({ $project: project });
  else aggPipeline.push({ $project: AggregateSelect.USER_BASIC_FIELDS });

  return {
    $lookup: {
      from: "users",
      localField,
      foreignField,
      as: alias,
      pipeline: aggPipeline,
    },
  };
};

module.exports = {
  UserAggregationLookup
};

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { default: slugify } = require("slugify");

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&\s]{8,}$/;

const NO_DATA_FOUND = process.env.BASE_URL + "storage/no-data-found.jpg";

const generateJwtAccessToken = async (params) => {
  return jwt.sign({ ...params }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
};

const verifyJwtToken = async (token) => {
  return jwt.verify(token, process.env.JWT_SECRET_KEY);
};

const checkPassword = (password, hashPassword) => {
  return bcrypt.compareSync(password, hashPassword);
};

const createHashPassword = (password) => {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(password, salt);
};

const convertFieldsToAggregateObject = (fields, demilater = ",") => {
  if (!fields) return { deletedAt: 0, deletedBy: 0 };
  if (typeof fields == "string") {
    fields = fields.trim();
    fields = fields.split(demilater);
  }
  let obj = {};
  for (let el of fields) if (el) obj[el] = 1;

  return obj;
};

const convertFieldsToAggregateGroup = (fields, demilater = ",") => {
  if (!fields) return { _id: "$_id" };
  if (typeof fields == "string") {
    fields = fields.trim();
    fields = fields.split(demilater);
  }
  let obj = {};
  for (let el of fields) if (el) obj[el] = `$${el}`;
  return obj;
};

const aggregateFileConcat = (column) => {
  return {
    $cond: {
      if: { $regexMatch: { input: "$image.url", regex: "^http" } },
      then: "$image.url",
      else: { $cond: [column, { $concat: [process.env.BASE_URL, column] }, NO_DATA_FOUND] },
    },
  };
};

const concatArrayFile = (fields) => {
  return {
    $set: {
      [fields]: {
        $map: {
          input: `$${fields}`,
          as: "item",
          in: { $mergeObjects: ["$$item", { url: { $concat: [process.env.BASE_URL, "$$item.url"] } }] },
        },
      },
    },
  };
};

const generateOTP = () => {
  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  return otp;
};

const validatePassword = (password) => {
  return PASSWORD_REGEX.test(password);
};

const validateMobileNumber = async (mobileNumber) => {
  const mobileNumberRegex = /^\d{10}$/;
  return mobileNumberRegex.test(mobileNumber);
};

const dateDiffInMinutes = (date1, date2) => {
  const total = date1.getTime() - date2.getTime();
  return Math.floor(total / 1000 / 60);
};

const dateDiffInDays = (date1, date2) => {
  const total = date1.getDate() - date2.getDate();
  return Math.floor(total);
};

const createSlug = (slug) => {
  const currentDate = new Date();
  const timestampInSeconds = Math.floor(currentDate.getTime() / 1000).toString();
  return (
    slugify(slug.toLowerCase(), {
      replacement: "-",
      remove: undefined,
      lower: false,
      trim: true,
    }) +
    "-" +
    timestampInSeconds
  );
};

const createGroupProjectionObject = (fields) => {
  const fieldArray = fields.split(" ");

  const projectionObject = {};

  fieldArray.forEach((field) => {
    projectionObject[field] = { $first: `$${field}` };
  });

  return projectionObject;
};

module.exports = {
  PASSWORD_REGEX,
  NO_DATA_FOUND,
  generateJwtAccessToken,
  verifyJwtToken,
  checkPassword,
  createHashPassword,
  convertFieldsToAggregateObject,
  convertFieldsToAggregateGroup,
  aggregateFileConcat,
  concatArrayFile,
  generateOTP,
  validatePassword,
  validateMobileNumber,
  dateDiffInMinutes,
  dateDiffInDays,
  createSlug,
  createGroupProjectionObject,
};

const { Schema } = require("mongoose");
const { Status } = require("../helper/typeConfig");

const locationSchema = Schema({
  address1: { type: String, default: null },
  address2: { type: String, default: null },
  city: { type: String, default: null },
  state: { type: String, default: null },
  country: { type: String, default: null },
  zipcode: { type: String, default: null },
  type: {
    type: String,
    enum: ["Point", "LineString", "Polygon", "MultiPoint"],
    default: "Point",
  },
  coordinates: { type: String, default: null },
});

const fileSchema = Schema({
  url: { type: String, default: null },
  filename: { type: String, default: null },
  size: { type: String, default: null },
  extension: { type: String, default: null },
  ordering: { type: Number, default: 0 },
  status: { type: Number, enum: [1, 2], default: 1 },
});

const socialMediaSchema = Schema({
  name: { type: String, default: null },
  code: { type: String, default: null },
  icon: { type: String, default: null },
  image: { type: String, default: null },
  url: { type: String, default: null },
  status: { type: Number, enum: [1, 2], default: 1 }, // 1:active,2 :inactive
});

const attributeValueSchema = Schema({
  name: { type: String, default: null },
  colorCode: { type: String, default: null },
});

const attributeSchema = Schema({
  name: { type: String, required: ["Attribute name is required"] },
  isColor: { type: Number, enum: [1, 2], default: 2 },
  status: { type: Number, enum: Status, default: Status[0] },
  values: { type: [attributeValueSchema], default: [] },
});

module.exports = {
  locationSchema,
  fileSchema,
  socialMediaSchema,
  attributeSchema,
  attributeValueSchema,
};

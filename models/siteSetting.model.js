const { Schema, model } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const { socialMediaSchema, locationSchema, fileSchema } = require("./helperSchema");

const siteSettingSchema = new Schema(
  {
    logo: { type: fileSchema, default: null },
    favicon: { type: fileSchema, default: null },
    title: { type: String, default: null },
    description: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    address: { type: locationSchema, default: null },
    social: { type: [socialMediaSchema], default: [] },
    copyright: { type: String, default: null },
    isUnderConstruction: { type: Boolean, default: false },
    referralCommission: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);
module.exports = model("site_settings", siteSettingSchema);

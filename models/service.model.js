const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const { Status, isFeatured } = require("../helper/typeConfig");
const { fileSchema, locationSchema } = require("./helperSchema");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const serviceSchema = Schema(
  {
    name: { type: String, trim: true, required: ["Name is required"] },
    slug: { type: String, unique: true },
    description: { type: String, default: null },
    cover: { type: fileSchema, default: null },
    gallery: { type: [fileSchema], default: [] },
    address: { type: locationSchema, default: {} },
    subcategoryId: { type: [ObjectId], ref: "categories", required: ["Please select categories"] },
    hourlyRate: { type: Number, default: 0 },
    vendorId: { type: ObjectId, ref: "users", required: ["Seller is required"] },
    status: { type: Number, enum: Status, default: Status[0] },
    featured: { type: Number, enum: isFeatured, default: isFeatured[0] },
    ordering: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

serviceSchema.plugin(mongooseAggregatePaginate);
module.exports = model("services", serviceSchema);

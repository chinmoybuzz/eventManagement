const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");
const { tagSchema, locationSchema } = require("./helperSchema");
const { Status, isFeatured } = require("../helper/typeConfig");
const { fileSchema } = require("./helperSchema");

const eventSchema = Schema(
  {
    title: { type: String, trim: true, required: ["Title field is required"] },
    slug: { type: String, trim: true, unique: true },
    isFeature: { type: Number, enum: isFeatured, default: isFeatured[0] },
    price: { type: Number, default: 0 },
    categoryId: {
      type: [ObjectId],
      ref: "categories",
      required: ["Please select category"],
    },
    description: { type: String, default: null },
    gallery: { type: [fileSchema], default: null },
    startDate: {
      type: Date,
      default: null,
      required: ["Start Date is required"],
    },
    endDate: { type: Date, default: null },
    tags: { type: [tagSchema], default: null },
    attendees: [{ type: ObjectId, ref: "users", default: [] }],
    address: { type: locationSchema, default: null },
    venue: { type: String, default: null },
    isOnline: { type: Number, enum: [1, 2], default: 1 }, //1=> True,2=>False
    eventLink: { type: String, default: null },
    status: { type: Number, enum: Status, default: Status[0] },
    ordering: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

eventSchema.plugin(mongoosePaginate);
module.exports = model("events", eventSchema);

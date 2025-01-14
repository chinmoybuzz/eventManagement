const { Schema, model } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { Status } = require("../helper/typeConfig");

const reviewSchema = Schema(
  {
    flexibility: {
      type: Number,
      min: [0, "Minimum flexibility rating is zero"],
      max: [5, "Maximum flexibility rating is five"],
    },
    qualityOfServices: {
      type: Number,
      min: [0, "Minimum service quality rating is zero"],
      max: [5, "Maximum service quality rating is five"],
    },
    responseTime: {
      type: Number,
      min: [0, "Minimum response time rating is zero"],
      max: [5, "Maximum response time rating is five"],
    },
    skill: {
      type: Number,
      min: [0, "Minimum skill rating is zero"],
      max: [5, "Maximum skill rating is five"],
    },
    value: {
      type: Number,
      min: [0, "Minimum value rating is zero"],
      max: [5, "Maximum value rating is five"],
    },
    rating: {
      type: Number,
      min: [0, "Minimum rating is zero"],
      max: [5, "Maximum rating is five"],
    },
    title: { type: String, default: null },
    review: { type: String, default: null },
    vendorId: { type: ObjectId, ref: "users", default: null },
    serviceId: { type: ObjectId, ref: "services", default: null },
    status: { type: Number, enum: Status, default: Status[0] },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

reviewSchema.plugin(mongooseAggregatePaginate);
module.exports = model("reviews", reviewSchema);

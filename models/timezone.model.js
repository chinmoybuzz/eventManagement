const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const timezonesSchema = Schema(
  {
    name: { type: String, default: null },
    zone: { type: String, default: null },
    offset: { type: String, default: null },
    deletedAt: { type: Date, default: null },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

timezonesSchema.plugin(mongooseAggregatePaginate);
module.exports = model("timezones", timezonesSchema);

const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const { Status } = require("../helper/typeConfig");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const eventTypeSchema = Schema(
  {
    name: { type: String, default: null },
    status: { type: Number, enum: Status, default: Status[0] },
    ordering: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

eventTypeSchema.plugin(mongooseAggregatePaginate);
module.exports = model("event_types", eventTypeSchema);

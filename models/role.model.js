const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const { Status } = require("../helper/typeConfig");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const roleSchema = Schema(
  {
    name: { type: String, required: ["Role name is required"] },
    code: { type: String, unique: true, required: ["Role code is required"] },
    status: { type: Number, enum: Status, default: Status[0] },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

roleSchema.plugin(mongooseAggregatePaginate);
module.exports = model("roles", roleSchema);

const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const { Status } = require("../helper/typeConfig");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const partyRoleSchema = Schema(
  {
    name: { type: String, default: null },
    status: { type: Number, enum: Status, default: Status[1] },
    ordering: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

partyRoleSchema.plugin(mongooseAggregatePaginate);
module.exports = model("partyRoles", partyRoleSchema);

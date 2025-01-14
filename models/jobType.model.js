const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");
const { Status } = require("../helper/typeConfig");

const jobTypeSchema = Schema(
  {
    title: { type: String, required: ["Title is required"] },
    status: { type: Number, enum: Status, default: Status[0] }, //1=> Active,2=>Inactive
    ordering: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

jobTypeSchema.plugin(mongoosePaginate);
module.exports = model("job_types", jobTypeSchema);

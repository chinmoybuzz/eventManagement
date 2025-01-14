const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");
const { fileSchema } = require("./helperSchema");
const { Status } = require("../helper/typeConfig");

const jobAppliedSchema = Schema(
  {
    roleCode: { type: String, default: null },
    jobId: { type: ObjectId, ref: "jobs", required: ["Job is Required"] },
    userId: { type: ObjectId, ref: "users", default: null },
    cvFile: { type: fileSchema, required: ["CV is required"] },
    message: { type: String, default: null },
    status: { type: Number, enum: Status, default: Status[0] },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

jobAppliedSchema.plugin(mongoosePaginate);
module.exports = model("job_applications", jobAppliedSchema);

const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");
const { locationSchema: jobLocationSchema } = require("./helperSchema");
// const jobTypeSchema = require("./jobType.model");
const { Status } = require("../helper/typeConfig");
const { fileSchema } = require("./helperSchema");

const jobAplicanteSchema = Schema(
  {
    userId: { type: ObjectId, ref: "users", default: null },
    cvFile: { type: fileSchema, default: null },
    message: { type: String, default: null },
    status: { type: Number, enum: Status, default: Status[0] },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

const fullNameSchema = Schema({
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
});

const jobSchema = Schema(
  {
    fullname: { type: fullNameSchema, default: null },
    email: { type: String, default: null },
    phoneNumber: { type: Number, default: null },
    title: { type: String, trim: true, required: ["Job Title is required"] },
    slug: { type: String, trim: true },
    category: { type: [ObjectId], ref: "categories", default: [] },
    description: { type: String, default: null },
    experience: { type: String, default: null },
    location: { type: jobLocationSchema, default: null },
    jobType: { type: ObjectId, ref: "job_types", default: null },
    jobPosition: { type: String, default: null },
    jobVacancy: { type: Number, default: null },
    salary: { type: Number, default: null },
    jobRequirement: { type: String, default: null },
    expirationDate: { type: Date, default: null },
    qualification: { type: String, default: null },
    jobFacilities: { type: String, default: null },
    jobAplicant: { type: [jobAplicanteSchema], default: null },
    status: { type: Number, enum: [1, 2, 3], default: 1 }, //1=> Active, 2=>Inactive, 3=>Draft
    featured: { type: Number, default: 2, enum: [1, 2] },
    saved: { type: [ObjectId], ref: "users", default: [] },
    ordering: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

jobSchema.plugin(mongoosePaginate);
module.exports = model("jobs", jobSchema);

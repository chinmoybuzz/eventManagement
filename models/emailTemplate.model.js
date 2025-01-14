const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const emailTemplateSchema = Schema(
  {
    code: { type: String, default: null },
    mailFor: { type: String, default: null },
    subject: { type: String, default: null },
    content: { type: String, default: null },
    toMail: { type: String, default: null },
    ccMail: { type: String, default: null },
    fromMail: { type: String, default: null },
    fromName: { type: String, default: null },
    variables: { type: Array, default: [] },
    status: { type: Number, default: true },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

emailTemplateSchema.plugin(mongooseAggregatePaginate);
module.exports = model("email_templates", emailTemplateSchema);

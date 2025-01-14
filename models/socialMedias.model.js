const { Schema, model } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const socialMediaSchema = Schema(
  {
    name: { type: String, required: ["Name is required"] },
    code: { type: String, unique: true, required: ["Code is required"] },
    icon: { type: String, default: null },
    ordering: { type: Number, default: 0 },
    status: { type: Number, enum: [1, 2], default: 1 }, // 1:active,2 :inactive
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

socialMediaSchema.plugin(mongoosePaginate);
module.exports = model("social_media", socialMediaSchema);

const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");
const { fileSchema } = require("./helperSchema");
const { Status } = require("../helper/typeConfig");

const postSchema = Schema(
  {
    title: { type: String, trim: true, required: ["Title field is required"] },
    slug: { type: String, unique: true, default: null },
    author: { type: ObjectId, ref: "users", default: null },
    categoryId: { type: [ObjectId], ref: "categories", required: ["Category field is required"] },
    shortDescription: {
      type: String,
      required: ["Short Description field is required"],
    },
    description: { type: Object, default: {} },
    publishDate: { type: Date, required: ["Publish Date is required"] },
    image: { type: fileSchema, default: null },
    gallery: { type: [fileSchema], default: null },
    featured: { type: Number, enum: [1, 2], default: 2 }, //1=> True, 2=>False
    status: { type: Number, enum: Status, default: Status[0] }, //1=> Active, 2=>Inactive, 3=>Draft
    ordering: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

postSchema.plugin(mongoosePaginate);
module.exports = model("posts", postSchema);

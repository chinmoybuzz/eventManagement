const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");
const { Status, CategoryTypes } = require("../helper/typeConfig");
const { fileSchema } = require("./helperSchema");

const categorySchema = Schema(
  {
    name: { type: String, trim: true, lowercase: true, required: ["Name field is required"] },
    description: { type: String, default: null },
    image: { type: fileSchema, default: null },
    type: { type: Number, enum: CategoryTypes, default: CategoryTypes[0] },
    isChild: { type: Number, enum: [1, 2], default: 2 }, // 1:Yes, 2:No
    ordering: { type: Number, default: 0 },
    parentId: { type: ObjectId, ref: "categories", default: null },
    status: { type: Number, enum: Status, default: Status[0] },
    deletedAt: { type: Date, default: null },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);
categorySchema.plugin(mongoosePaginate);

module.exports = model("categories", categorySchema);

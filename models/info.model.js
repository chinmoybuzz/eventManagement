const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const { Status } = require("../helper/typeConfig");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const buttonSchema = Schema({
  name: { type: String, default: null },
  link: { type: String, default: null },
  ordering: { type: Number, default: 0 },
});

const cardSchema = Schema({
  icon: { type: String, default: null },
  name: { type: String, default: null },
  content: { type: String, /* maxlength: 160,*/ default: null },
  link: { type: String, default: null },
  ordering: { type: Number, default: 0 },
});

const infoSchema = Schema(
  {
    title: { type: String, default: null },
    description: { type: String, default: null },
    cards: { type: [cardSchema], default: null },
    buttons: { type: [buttonSchema], default: null },
    page: { type: String, required: ["Please select a page"] },
    status: { type: Number, enum: Status, default: Status[0] },
    ordering: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

infoSchema.plugin(mongooseAggregatePaginate);
module.exports = model("infos", infoSchema);

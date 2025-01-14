const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const { Status } = require("../helper/typeConfig");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const answerSchema = Schema({
  answer: {
    type: String,
    trim: true,
    validate: {
      validator: function (value) {
        if (!value) return false;
        const regex = /^[A-Za-z0-9\s\-"'.,!?]{5,500}$/;
        return regex.test(value);
      },
      message: (props) =>
        `${props.value === "" ? "Empty" : props.value} is not a valid answer. It should be 5 to 500 characters.`,
    },
    default: null,
  },
  answeredBy: { type: ObjectId, default: null },
  helpfulId: { type: [ObjectId], default: null },
  unhelpfulId: { type: [ObjectId], default: null },
});

const faqSchema = Schema(
  {
    question: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          if (!value) return false;
          const regex = /^[A-Za-z0-9\s\-"'.,!?]{5,500}$/;
          return regex.test(value);
        },
        message: (props) =>
          `${props.value === "" ? "Empty" : props.value} is not a valid question. It should be 5 to 500 characters.`,
      },
      default: null,
    },
    answers: { type: [answerSchema], default: [] },
    ordering: { type: Number, default: 0 },
    status: { type: Number, enum: Status, default: Status[0] },
    forId: { type: ObjectId, required: ["Please select for what you are adding this FAQ"] },
    addedBy: { type: String, enum: ["owner", "user"], default: "user" },
    FAQfor: { type: String, enum: ["user", "service"], default: "user" },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

faqSchema.plugin(mongooseAggregatePaginate);
module.exports = model("faqs", faqSchema);

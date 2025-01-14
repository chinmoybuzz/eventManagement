const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const { Status, PlanDurationType } = require("../helper/typeConfig");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const featureSchema = Schema({
  name: { type: String, default: null },
  count: { type: Number, default: null },
  code: { type: String, enum: ["service", "booking"], default: "service" },
  available: { type: Boolean, default: false },
});

const planSchema = Schema(
  {
    code: { type: String, default: null, unique: true },
    stripeProductId: { type: String, default: null },
    name: { type: String, default: null, required: ["Name is required"] },
    price: { type: Number, default: 0, required: ["Price is required"] },
    description: { type: String, default: null },
    features: { type: [featureSchema], default: [] },
    duration: { type: Number, default: 0, required: ["Duration is required"] },
    interval: { type: String, enum: PlanDurationType, default: PlanDurationType[0] },
    isPopular: { type: Number, enum: [1, 2], default: 2 }, // yes:1, no:2
    status: { type: Number, enum: Status, default: Status[0] },
    ordering: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

planSchema.plugin(mongooseAggregatePaginate);
module.exports = model("plans", planSchema);

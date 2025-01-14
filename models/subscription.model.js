const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const subscriptionSchema = Schema(
  {
    subscriptionId: { type: String, default: null },
    userId: { type: ObjectId, ref: "users", default: null },
    planId: { type: ObjectId, ref: "plans", default: null },
    startDate: { type: Date, default: new Date() },
    endDate: { type: Date, default: null },
    subscriptionInfo: { type: Object, default: null },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

subscriptionSchema.plugin(mongooseAggregatePaginate);
module.exports = model("subscriptions", subscriptionSchema);

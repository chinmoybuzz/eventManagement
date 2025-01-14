const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const { PaymentStatus, Status, paymentType } = require("../helper/typeConfig");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const transactionSchema = Schema(
  {
    subscriptionId: { type: ObjectId, ref: "subscriptions", default: null },
    transactionId: { type: String, default: null },
    userId: { type: ObjectId, ref: "users", default: null },
    planId: { type: ObjectId, ref: "plans", default: null },
    amount: { type: Number, default: 0 },
    transactionDate: { type: Date, default: new Date() },
    transactionInfo: { type: Object, default: null },
    webhookInfo: { type: Object, default: null },
    webhookRefundInfo: { type: Object, default: null },
    paymentStatus: { type: Number, enum: PaymentStatus, default: PaymentStatus[1] },
    paymentType: { type: Number, enum: paymentType, default: paymentType[0] },
    ordering: { type: Number, default: 0 },
    status: { type: Number, enum: Status, default: Status[0] },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

transactionSchema.plugin(mongooseAggregatePaginate);
module.exports = model("transactions", transactionSchema);

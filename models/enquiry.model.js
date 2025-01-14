const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");
const { Status, contactType } = require("../helper/typeConfig");

const fullnameSchema = Schema({
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
});

const chatSchema = Schema(
  {
    message: { type: "string", required: [] },
    senderId: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

const enquirySchema = Schema(
  {
    bookingId: { type: ObjectId, ref: "bookings", default: null },
    enquirytype: { type: String, enum: contactType, default: contactType[0] },
    chat: { type: [chatSchema], default: [] },
    ticketNo: { type: String, default: null },
    fullname: { type: fullnameSchema, default: null },
    email: { type: String, match: /.+\@.+\..+/, trim: true, lowercase: true },
    phone: { type: String },
    phoneCode: { type: String },
    serviceId: { type: ObjectId, ref: "services", default: null },
    userId: { type: ObjectId, ref: "users", default: null },
    venderId: { type: ObjectId, ref: "users", default: null },
    subject: { type: String, required: ["Please write a subject"] },
    message: { type: String, required: ["Please write a message"] },
    status: { type: Number, enum: Status, default: Status[2] },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedBy: { type: ObjectId, default: null, ref: "users" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

enquirySchema.plugin(mongoosePaginate);
module.exports = model("enquiries", enquirySchema);

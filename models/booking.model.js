const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const { BookingType, thisEvent, Status, Venue } = require("../helper/typeConfig");
const { locationSchema } = require("./helperSchema");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const contactDetailSchema = Schema({
  firstName: { type: String, required: ["First name is required"] },
  lastName: { type: String, required: ["Last name is required"] },
  email: { type: String, trim: true, lowercase: true, required: ["Email is required"] },
  phone: { type: String, required: ["Phone number is required"] },
  company: { type: String, default: null },
  occupation: { type: String, default: null },
  phoneCode: { type: String, default: null },
});

const bookingSchema = Schema(
  {
    vendorId: { type: ObjectId, ref: "users", required: ["Please select a vendor"] },
    eventType: { type: String, default: null },
    thisEvent: { type: String, enum: thisEvent, default: thisEvent[0] },
    serviceId: { type: ObjectId, ref: "services", required: ["Please select a service"] },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    eventVenue: { type: String, enum: Venue, default: Venue[0] },
    numberOfGuest: { type: Number, default: null },
    eventLocation: { type: locationSchema, default: null },
    timeZoneId: { type: ObjectId, default: null },
    vendorStartTime: { type: String, default: null },
    vendorBudget: { type: Number, default: null },
    vendorLength: { type: Number, default: null },
    details: { type: String, default: null },
    vendorsCotactCount: { type: Number, default: null },
    contactDetails: { type: contactDetailSchema, required: ["Contact details is required"] },
    userId: { type: ObjectId, ref: "users", default: null },
    partyRole: { type: ObjectId, ref: "partyroles", default: null },
    bookingType: { type: String, enum: BookingType, default: BookingType[0] },
    status: { type: Number, enum: Status, default: Status[2] },
    ordering: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

bookingSchema.plugin(mongooseAggregatePaginate);
module.exports = model("bookings", bookingSchema);

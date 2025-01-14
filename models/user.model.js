const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");
const { locationSchema, fileSchema } = require("./helperSchema");
const { Status, gender, emailVerified, isFeatured, UserRole } = require("../helper/typeConfig");
const { socialMediaSchema } = require("./helperSchema");

const fullnameSchema = Schema({
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
});

const openTimeSchema = Schema({
  day: {
    type: String,
    enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    required: true,
  },
  open: { type: String, default: null },
  close: { type: String, default: null },
});

const verificationMeetingSchema = new Schema({
  link: { type: String, default: null },
  date: { type: Date, defalut: null },
});

const settingSchema = new Schema({
  notification: { type: Boolean, default: true },
  emailNotification: { type: Boolean, default: true },
  pushNotification: { type: Boolean, default: true },
});

const userSchema = Schema(
  {
    fullname: { type: fullnameSchema, default: null },
    username: { type: String, trim: true, unique: true, lowercase: true, required: ["Please select an username"] },
    platform: { type: String, enum: ["web", "app"], default: "web" },
    email: {
      type: String,
      match: /.+\@.+\..+/,
      unique: true,
      trim: true,
      lowercase: true,
      required: ["Email field is required"],
    },
    image: { type: fileSchema, default: null },
    portfolioImage: { type: [fileSchema], default: null },
    emailVerified: { type: Number, enum: emailVerified, default: emailVerified[0] }, // 1=> Verified, 2=>Unverified
    emailVerifiedAt: { type: Date, default: null },
    password: { type: String, default: null, select: false },
    passwordResetDate: { type: Date, default: new Date() },
    roleCode: { type: String, enum: UserRole, default: "user" },
    isVendor: { type: Boolean, default: false },
    referral: { referredBy: { type: ObjectId, ref: "users", default: null }, commission: { type: Number, default: 0 } },
    favouriteVendors: { type: [ObjectId], ref: "users", default: null },
    status: { type: Number, enum: Status, default: Status[0] },
    ordering: { type: Number, default: 0 },
    refreshTokens: { type: [String], default: [] },
    lastLogin: { type: Date, default: null },
    emailOtp: { type: String, default: null },
    emailOtpTime: { type: Date, default: null },
    address: { type: locationSchema, default: null },
    social: { type: [socialMediaSchema], default: [] },
    about: { type: String, default: null },
    categoryId: { type: [ObjectId], ref: "categories", default: null },
    skills: { type: [String], default: null },
    hourlyRate: { type: Number, default: 0 },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: gender, default: gender[0] },
    phone: { type: String, default: null },
    phoneCode: { type: String, default: null },
    isFeatured: { type: Number, enum: isFeatured, default: isFeatured[1] },
    isTopVendor: { type: Boolean, default: false },
    isIdentifyVerified: { type: Boolean, default: false },
    isMembershipVerified: { type: Boolean, default: false },
    isPreferredVendor: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    paymentAccepted: { type: String, default: null },
    terms: { type: String, default: null },
    openTime: { type: [openTimeSchema], default: null },
    meeting: { type: verificationMeetingSchema, defalut: null },
    setting: { type: settingSchema, default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

userSchema.plugin(mongoosePaginate);
module.exports = model("users", userSchema);

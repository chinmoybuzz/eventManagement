const Status = [1, 2, 3];
//{ ACTIVE: 1, INACTIVE: 2, PENDING: 3 } / {  accept: 1, reject: 2, pending: 3 };

const ChatStatus = [1, 2, 3, 4]; // { requested: 1, accepted: 2, rejected: 3, left: 4 };

const CategoryTypes = [1, 2, 3]; // {Job: 1, Post: 2, service / event: 3 };

const PlanDurationType = [null, "day", "week", "month", "year"];

const CitySearchType = { USER: "user", EVENT: "event" };

const emailVerified = [1, 2]; //1=> Verified,2=>Unverified

const UserRole = ["user", "admin", "company"]; //vendor n user roleCode : user

const isFeatured = [1, 2]; // { FEATURED: 1, NOT_FEATURED: 2 };

const PaymentStatus = [1, 2, 3, 4]; // { PENDING: 1, SUCCESS: 2, REJECT: 3, REFUND: 4 };

const paymentType = [1, 2]; // { debit : 1, credit : 2 }

const gender = [null, "male", "female", "other"];

const ActivityLogType = [1, 2]; // { PARTY: 1, HOME: 2 };

const BookingStatus = { ACTIVE: 1, INACTIVE: 2, PENDING: 3 };

const BookingType = [1, 2]; // { BOOKING: 1, ENQUERY: 2 };

const Venue = ["House", "Hall", "Restaurant", "Office"];

const thisEvent = ["InPerson", "Contactless", "OnlineEvent"];

const WhyUsType = {
  INSPIRATION: "inspiration",
  CONFIDENCE: "confidence",
  HOWITISWORK: "howItIsWork",
  WORKDONE: "workDone",
};

const NO_DATA_FOUND = process.env.BASE_URL + "storage/no-data-found.jpg";

const USER_BASIC_FIELDS = { email: 1, phone: 1, altPhone: 1, fullname: 1 };

const UserHiddenFields = {
  deletedAt: 0,
  deletedBy: 0,
  password: 0,
  roles: 0,
  refreshToken: 0,
  refreshTokens: 0,
  emailOtp: 0,
  emailOtpTime: 0,
  lastLogin: 0,
  stripeCustomerId: 0,
};

const USER_SHOW_FIELDS = { fullname: 1, email: 1 };

const AggregateSelect = {
  USER_BASIC_FIELDS: USER_SHOW_FIELDS,
  USER_FIELDS: USER_BASIC_FIELDS,
  COMPANY_FIELDS: {
    ...USER_BASIC_FIELDS,
    companyDetails: 1,
  },
};

const EmailTemplatesCode = {
  JOB_APPLICATION_SUBMITED_FOR_USER: "job-application-submited-for-user",
  JOB_APPLICATION_SUBMITED_FOR_ADMIN: "job-application-submited-for-admin",
  JOB_STATUS_CHANGE: "job-status-change",
  SEND_OTP: "send-otp",
  EVENT_ENROLL_SUBMITED_FOR_ATTENDEES_USER: "event-enroll-submited-for-attendess-user",
  ENQUIRY_SUBMITED_FOR_USER: "enquiry_submited_for_user",
  ENQUIRY_RESPONSE: "enquiry-response",
  BOOKING_RESPONSE_USER: "booking_response_user",
  BOOKING_RESPONSE_ADMIN: "booking_response_admin",
};

const contactType = ["CONTACT", "ENQUIRY", "COMPLAIN"];

module.exports = {
  Status,
  ChatStatus,
  CategoryTypes,
  PlanDurationType,
  gender,
  CitySearchType,
  emailVerified,
  UserHiddenFields,
  UserRole,
  NO_DATA_FOUND,
  USER_SHOW_FIELDS,
  isFeatured,
  AggregateSelect,
  PaymentStatus,
  paymentType,
  ActivityLogType,
  BookingStatus,
  BookingType,
  thisEvent,
  WhyUsType,
  EmailTemplatesCode,
  Venue,
  contactType,
};

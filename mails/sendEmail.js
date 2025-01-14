const Model = require("../models/emailTemplate.model");
const SiteSettingModel = require("../models/siteSetting.model");
const { EmailTemplatesCode, Status } = require("../helper/typeConfig");
const { MailSender } = require("../config/mailer");

let SiteSetting = null;

exports.SendOtpMail = async (params) => {
  const emailTemplate = await Model.findOne({
    code: EmailTemplatesCode.SEND_OTP,
    deletedAt: null,
  });
  if (!emailTemplate) throw new Error("Email template not Found on this Code " + EmailTemplatesCode.SEND_OTP);
  if (!SiteSetting) SiteSetting = await SiteSettingModel.findOne().lean();

  let html = emailTemplate.content
    .replace("{%LOGO%}", process.env.BASE_URL + SiteSetting.logo.url)
    .replace("{%LOGO_ALT_TEXT%}", SiteSetting.title + " Logo")
    .replaceAll("{%APP_NAME%}", SiteSetting.title)
    .replace("{%YEAR%}", new Date().getFullYear())
    .replace("{%OTP%}", params.otp);

  const mailData = {
    from: { name: emailTemplate.fromName, address: emailTemplate.fromMail },
    html,
    to: params.email,
    subject: params.subject ? params.subject : emailTemplate.subject,
  };
  MailSender.send(mailData);
};

exports.commonEmailThankYou = async (params, templateCode) => {
  const emailTemplate = await Model.findOne({
    code: EmailTemplatesCode[templateCode],
    deletedAt: null,
  });

  if (!emailTemplate) {
    throw new Error(`Email template not found for code: ${templateCode}`);
  }

  if (!SiteSetting) {
    SiteSetting = await SiteSettingModel.findOne().lean();
  }

  let statusName = "";
  switch (params.status) {
    case Status[0]:
      statusName = "Accepted";
      break;
    case Status[1]:
      statusName = "Rejected";
      break;
    case Status[2]:
      statusName = "Pending";
      break;
  }
  let html = emailTemplate.content
    .replace("{%LOGO%}", process.env.BASE_URL + SiteSetting.logo)
    .replace("{%APP_NAME%}", SiteSetting.title)
    .replaceAll("{%YEAR%}", new Date().getFullYear())
    .replace("{%JOB_TITLE%}", params.job?.title)
    .replace("{%USER_EMAIL%}", params.user?.email)
    .replace("{%USER_NAME%}", `${params.user?.fullname.firstName} ${params.user?.fullname.lastName}`)
    .replaceAll("{%COMPANY_NAME%}", getCompanyName(params.company))
    .replace("{%JOB_STATUS%}", statusName)
    .replace("{%MESSAGE%}", params.message ? params.message : "")
    .replace("{%APPLICATION_DATE%}", params.applyDate)
    .replaceAll("{%ENQUIRY_TITLE%}", params.subject)
    .replaceAll("{%ENQUIRY_MESSAGE%}", params.message)
    .replaceAll("{%PHONE_CODE%}", params.phoneCode)
    .replaceAll("{%PHONE_NUMBER%}", params.phone)
    .replaceAll("{%TICKET_NO%}", params.ticketNo)
    .replaceAll("{%BOOKING_TITLE%}", params.bookingTitle);

  function getCompanyName(company) {
    if (company?.fullname?.firstName && company?.fullname?.lastName) {
      return `${company?.fullname?.firstName} ${company?.fullname?.lastName}`;
    } else {
      return company?.fullname?.firstName || company?.fullname?.lastName || "N/A";
    }
  }

  const mailData = {
    from: { name: emailTemplate.fromName, address: emailTemplate.fromMail },
    html,
    to: params.toMail.email,
    subject: emailTemplate.subject,
  };

  await MailSender.send(mailData);
};

const Model = require("../models/user.model");
const SiteSettings = require("../models/siteSetting.model");
const randomstring = require("randomstring");
const {
  generateJwtAccessToken,
  checkPassword,
  createHashPassword,
  generateOTP,
  dateDiffInMinutes,
  PASSWORD_REGEX,
  validatePassword,
} = require("../helper/index");
const errorHandler = require("../helper/errorHandler");
const { SendOtpMail } = require("../mails/sendEmail");
const { Status, UserRole } = require("../helper/typeConfig");

exports.login = async (params) => {
  try {
    const user = await Model.findOne({
      $or: [{ email: params.email.toLowerCase() }, { username: params.email.toLowerCase() }],
      deletedAt: null,
    }).select("_id fullname username email password roleCode emailVerified status");

    if (!user)
      return {
        status: 400,
        message: "Login details is incorrect, please try again",
      };

    if (!checkPassword(params.password, user.password)) {
      return {
        status: 400,
        message: `Hey ${user?.fullname.firstName}, you have entered an incorrect password, please try again.`,
      };
    }
    if (user.status != Status[0]) return { status: 400, message: "Your account is deactivated" };
    if (user.emailVerified == 2) return { status: 400, message: "Account is not verified" };
    if (user.roleCode != UserRole[1]) return { status: 400, message: "Access Denied" };

    const refreshToken = randomstring.generate(256);

    await Model.updateOne({ _id: user._id }, { $push: { refreshTokens: refreshToken }, lastLogin: new Date() });

    const accessToken = await generateJwtAccessToken({
      _id: user._id,
      fullname: user?.fullname,
      username: user.username,
      role: user?.roleCode,
      email: user.email,
    });

    return {
      status: 200,
      message: `Hi ${user?.fullname.firstName}, you have successfully logged in.`,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE_TIME,
    };
  } catch (err) {
    return { status: 400, message: err.message };
  }
};

exports.userLogin = async (params) => {
  try {
    const user = await Model.findOne({
      $or: [{ email: params.email.toLowerCase() }, { username: params.email.toLowerCase() }],
      deletedAt: null,
    }).select("_id fullname username email password roleCode emailVerified status");

    if (!user)
      return {
        status: 400,
        message: "Login details is incorrect, please try again",
      };

    if (!checkPassword(params.password, user.password)) {
      return {
        status: 400,
        message: `Hey ${user?.fullname.firstName}, you have entered an incorrect password, please try again.`,
      };
    }
    if (user.status != Status[0]) return { status: 400, message: "Your Account is Deactivated" };

    if (user.emailVerified == 2) return { status: 400, message: "Account is not verified" };

    if (user.roleCode == UserRole[1]) return { status: 400, message: "Login using admin" };

    const refreshToken = randomstring.generate(256);
    await Model.updateOne({ _id: user._id }, { $push: { refreshTokens: refreshToken }, lastLogin: new Date() });

    const accessToken = await generateJwtAccessToken({
      _id: user._id,
      fullname: user?.fullname,
      username: user.username,
      role: user?.roleCode,
      email: user.email,
    });

    return {
      status: 200,
      message: `Hi ${user?.fullname.firstName}, you have successfully logged in.`,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE_TIME,
    };
  } catch (err) {
    return { status: 400, message: err.message };
  }
};

exports.refresh = async (params) => {
  try {
    const user = await Model.findOne({ refreshTokens: params.refreshToken, deletedAt: null }).select(
      "fullname username roleCode email"
    );

    if (!user) return { status: 400, message: "Invalid token, please try again" };

    await Model.updateOne({ _id: user._id }, { $pull: { refreshTokens: params.refreshToken } });

    const refreshToken = randomstring.generate(256);
    await Model.updateOne({ _id: user._id }, { $push: { refreshTokens: refreshToken } });

    const accessToken = await generateJwtAccessToken({
      _id: user._id,
      fullname: user?.fullname,
      username: user.username,
      role: user?.roleCode,
      email: user.email,
    });

    return {
      status: 200,
      message: "Access token genrated successfully",
      accessToken,
      refreshToken,
    };
  } catch (err) {
    return { status: 400, message: err.message };
  }
};

exports.signup = async (params) => {
  try {
    if (!params.fullname) return { status: 400, message: "Please enter your name" };
    if (!params.fullname.firstName) return { status: 400, message: "Please enter your first name" };
    if (!params.fullname.lastName) return { status: 400, message: "Please entar your last name" };
    if (!params.email) return { status: 400, message: "Email is required" };
    if (!params.password) return { status: 400, message: "Password is required" };
    const checkpassword = await validatePassword(params.password);
    if (!checkpassword) {
      return {
        status: 400,
        message:
          "Password need to contain eight characters with one capital letter, one small letter, one number and one symbol",
      };
    }
    params.email = params.email.toLowerCase();
    const checkEmail = await Model.findOne({ email: params.email });
    if (checkEmail) return { status: 400, message: "Email already exists" };

    if (params.referredBy) {
      params.referral = {};
      const setting = await SiteSettings.findOne({ deletedAt: null });
      params.referral.commission = setting.referralCommission;
      const referrer = await Model.findOne({ username: params.referredBy });
      params.referral.referredBy = referrer._id;
    }

    if (params.isVendor === ("true" || true)) params.isVendor = true;

    await new Model({ ...params, email: params.email, password: createHashPassword(params.password) }).save();
    await this.sendOtp({ email: params.email });
    return { status: 200, message: "Verify OTP to complete signup" };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.sendOtp = async (params) => {
  try {
    const checkData = await Model.findOne({
      email: params.email.toLowerCase(),
      deletedAt: null,
    }).lean();
    if (!checkData) return { status: 404, message: "Invalid Email" };

    const otp = generateOTP();

    await Model.findByIdAndUpdate(checkData._id, {
      emailOtp: otp,
      emailOtpTime: new Date(),
    });
    await SendOtpMail({ email: checkData.email, otp });
    return { status: 200, message: "An OTP has been send to your email" };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.verifyOtp = async (params) => {
  try {
    const user = await Model.findOne({ email: params.email.toLowerCase(), deletedAt: null }).select(
      "fullname username roleCode email emailOtpTime emailOtp"
    );

    if (!user) return { status: 404, message: "Invalid Email" };

    if (dateDiffInMinutes(new Date(), new Date(user.emailOtpTime)) > 30)
      return { status: 400, message: "The OTP has been expired" };

    if (user.emailOtp != params.otp) return { status: 400, message: "Invalid OTP" };

    const refreshToken = randomstring.generate(256);

    await Model.updateOne(
      { _id: user._id },
      {
        $push: { refreshTokens: refreshToken },
        lastLogin: new Date(),
        emailOtp: null,
        emailOtpTime: null,
        emailVerified: 1,
        emailVerifiedAt: new Date(),
      }
    );

    const accessToken = await generateJwtAccessToken({
      _id: user._id,
      fullname: user?.fullname,
      username: user.username,
      role: user?.roleCode,
      email: user.email,
    });

    return {
      status: 200,
      message: params.verifyType ? `OTP has been verified for ${params.verifyType}` : `Your OTP has been verified`,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.forgotPassword = async (params) => {
  try {
    if (!params.newPassword) return { status: 400, message: "Confirm password is required" };
    if (!params.confirmPassword) return { status: 400, message: "New password is required" };

    if (params.newPassword != params.confirmPassword)
      return { status: 400, message: "New Password and confirm password didn't match" };

    if (!PASSWORD_REGEX.test(params.newPassword))
      return { status: 400, message: "Minimum eight characters, at least one letter, one number" };

    const password = createHashPassword(params.newPassword);

    const user = await Model.findOneAndUpdate(
      { _id: params.authUser._id },
      { password, passwordResetDate: new Date() }
    ).select("name");

    const refreshToken = randomstring.generate(256);

    await Model.updateOne({ _id: user._id }, { $push: { refreshTokens: refreshToken }, lastLogin: new Date() });

    const accessToken = await generateJwtAccessToken({
      _id: user._id,
      fullname: user?.fullname,
      username: user.username,
      role: user?.roleCode,
      email: user.email,
    });

    return {
      status: 200,
      message: "Password changed successfully",
      accessToken,
      refreshToken,
    };
  } catch (err) {
    return errorHandler(err, params);
  }
};

exports.resetPassword = async (params) => {
  try {
    const user = await Model.findById({
      _id: params.userId ? params.userId : params.authUser._id,
      deletedAt: null,
    }).select("_id fullname password");
    if (!user)
      return {
        status: 400,
        message: "Login details is incorrect, please try again",
      };

    if (!checkPassword(params.oldPassword, user.password)) {
      return {
        status: 400,
        message: `Hey ${user?.fullname.firstName}, you have entered an incorrect password, please try again`,
      };
    }
    if (params.newPassword !== params.confirmPassword) {
      return {
        status: 400,
        message: `Hey ${user?.fullname.firstName}, new password and confirm password did not match`,
      };
    }
    const password = createHashPassword(params.newPassword);
    await Model.updateOne({ _id: user._id }, { password, passwordResetDate: new Date() });
    return { status: 200, message: "Password changed successfully" };
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const roleCode = req.query.state;
    const { sub, given_name, family_name, picture, email } = req.user._json;
    const userData = {
      fullname: { firstName: given_name, lastName: family_name },
      email,
      image: { url: picture },
      username: given_name + sub,
      roleCode,
    };

    let user;

    user = await Model.findOne({ email: email.toLowerCase() });

    if (user) {
      user = await Model.findByIdAndUpdate({ _id: user._id }, userData);
    } else user = await new Model(userData).save();

    const refreshToken = randomstring.generate(256);

    await Model.updateOne({ _id: user._id }, { $push: { refreshTokens: refreshToken } });

    user = await Model.findOne({ _id: user._id }).select("fullname username roleCode email");

    const accessToken = await generateJwtAccessToken({
      _id: user._id,
      fullname: user?.fullname,
      username: user.username,
      role: user?.roleCode,
      email: user.email,
    });

    res.redirect(`${process.env.FRONT_URL}verify-user?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error) {
    return errorHandler(error, params);
  }
};

exports.fbLogin = async (req, res) => {
  try {
    const roleCode = req.query.state;
    const { id, first_name, last_name, picture, email } = req.user._json;

    const userData = {
      fullname: { firstName: first_name, lastName: last_name },
      email,
      image: { url: picture.data.url },
      username: first_name + id,
      roleCode,
    };

    let user;

    user = await Model.findOne({ email: email.toLowerCase() });

    if (user) {
      user = await Model.findByIdAndUpdate({ _id: user._id }, userData);
    } else user = await new Model(userData).save();

    const refreshToken = randomstring.generate(256);

    await Model.updateOne({ _id: user._id }, { $push: { refreshTokens: refreshToken } });

    user = await Model.findOne({ _id: user._id }).select("fullname username roleCode email");

    const accessToken = await generateJwtAccessToken({
      _id: user._id,
      fullname: user?.fullname,
      username: user.username,
      role: user?.roleCode,
      email: user.email,
    });

    res.redirect(`${process.env.FRONT_URL}verify-user?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error) {
    return errorHandler(error, { ...req.query, ...req.user });
  }
};

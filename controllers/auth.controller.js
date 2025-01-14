const repository = require("../repository/auth.repository");

exports.login = async (req, res) => {
  const data = await repository.login(req.body);
  return res.send(data);
};

exports.userLogin = async (req, res) => {
  const data = await repository.userLogin(req.body);
  return res.send(data);
};

exports.signup = async (req, res) => {
  const data = await repository.signup(req.body);
  return res.send(data);
};

exports.sendOtp = async (req, res) => {
  const data = await repository.sendOtp(req.body);
  return res.send(data);
};

exports.verifyOtp = async (req, res) => {
  const data = await repository.verifyOtp(req.body);
  return res.send(data);
};

exports.forgotPassword = async (req, res) => {
  const data = await repository.forgotPassword(req.body);
  return res.send(data);
};

exports.resetPassword = async (req, res) => {
  const data = await repository.resetPassword(req.body);
  return res.send(data);
};

exports.verifyToken = async (req, res) => {
  const user = res.locals.authenticatedUser;
  return res.send({ message: "Token Verified", data: user });
};

exports.refreshToken = async (req, res) => {
  const data = await repository.refresh(req.body);
  return res.send(data);
};

exports.googleLogin = async (req, res) => {
  const data = await repository.googleLogin(req, res);
  return res.send(data);
};

exports.fbLogin = async (req, res) => {
  const data = await repository.fbLogin(req, res);
  return res.send(data);
};

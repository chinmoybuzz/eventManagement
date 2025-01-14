const userRepository = require("../repository/user.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await userRepository.findAllData({ ...req.query });
  return res.send(data);
};

exports.findOneData = async (req, res) => {
  const data = await userRepository.findOneData({
    ...req.query,
    id: req.params.id,
  });
  return res.send(data);
};

exports.manage = async (req, res) => {
  const portfolioImage = req.files.filter((img) => img.fieldname.startsWith("portfolioImage["));
  const image = req.files.filter((img) => img.fieldname.startsWith("image"));
  const data = await userRepository.manage({ ...req.body, image, portfolioImage });
  return res.send(data);
};

exports.username = async (req, res) => {
  const data = await userRepository.username({ ...req.body });
  return res.send(data);
};

exports.changeStatus = async (req, res) => {
  const data = await commonRepository.changeStatus({ ...req.body, model: "user" });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({ ...req.body, model: "user" });
  return res.send(data);
};

exports.changeFeatured = async (req, res) => {
  const data = await commonRepository.changeFeatured({ ...req.body, model: "user" });
  return res.send(data);
};

exports.remove = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, model: "user" });
  return res.send(data);
};

exports.deleteFileFromArray = async (req, res) => {
  const data = await commonRepository.deleteFileFromArray({ ...req.body, model: "user" });
  return res.send(data);
};

exports.deleteSocial = async (req, res) => {
  const data = await userRepository.deleteSocial({ ...req.body });
  return res.send(data);
};

exports.portfolioImageStatusChange = async (req, res) => {
  const data = await userRepository.portfolioImageStatusChange({ ...req.body });
  return res.send(data);
};

exports.portfolioImageOrdering = async (req, res) => {
  const data = await userRepository.portfolioImageOrdering({ ...req.body });
  return res.send(data);
};

exports.manageFavorite = async (req, res) => {
  const data = await userRepository.manageFavorite(req.body);
  return res.send(data);
};

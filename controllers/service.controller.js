const repository = require("../repository/service.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.manage = async (req, res) => {
  const cover = req.files.filter((cov) => cov.fieldname.startsWith("cover"));
  const gallery = req.files.filter((gal) => gal.fieldname.startsWith("gallery["));
  const data = await repository.manage({ ...req.body, gallery, cover, id: req.params.id });
  return res.send(data);
};

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData({ ...req.query, ...req.body });
  return res.send(data);
};

exports.findOneData = async (req, res) => {
  const data = await repository.findOneData({ id: req.params.id });
  return res.send(data);
};

exports.categoriesGroup = async (req, res) => {
  const data = await repository.categoriesGroup();
  return res.send(data);
};

exports.changeStatus = async (req, res) => {
  const data = await commonRepository.changeStatus({ ...req.body, model: "service" });
  return res.send(data);
};

exports.changeFeatured = async (req, res) => {
  const data = await commonRepository.changeFeatured({ ...req.body, model: "service" });
  return res.send(data);
};

exports.remove = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, model: "service" });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({ ...req.body, model: "service" });
  return res.send(data);
};

exports.deleteFileFromArray = async (req, res) => {
  const data = await commonRepository.deleteFileFromArray({ ...req.body, model: "service" });
  return res.send(data);
};

const repository = require("../repository/page.repository");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData(req.query);
  return res.send(data);
};

exports.details = async (req, res) => {
  const data = await repository.details(req.query);
  return res.send(data);
};

exports.manage = async (req, res) => {
  const image = req.files.filter((img) => img.fieldname === "image");
  const bannerImg = req.files.filter((img) => img.fieldname.startsWith("bannerImage["));
  const data = await repository.manage({ ...req.body, image, bannerImg });
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({ ...req.body, model: "page" });
  return res.send(data);
};

exports.deleteData = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, ids: req.params.id, model: "page" });
  return res.send(data);
};

exports.deleteAll = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, model: "page" });
  return res.send(data);
};

exports.pageOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({ ...req.body, model: "page" });
  return res.send(data);
};

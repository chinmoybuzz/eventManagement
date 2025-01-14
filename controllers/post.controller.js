const repository = require("../repository/post.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData({ ...req.body, ...req.query });
  return res.send(data);
};

exports.findOneData = async (req, res) => {
  const data = await repository.details({ ...req.body, id: req.params.id });
  return res.send(data);
};

exports.authors = async (req, res) => {
  const data = await repository.authors(req.query);
  return res.send(data);
};

exports.manage = async (req, res) => {
  const image = req.files.filter((img) => img.fieldname.startsWith("image"));
  const gallery = req.files.filter((img) => img.fieldname.startsWith("gallery["));

  const data = await repository.manage({ ...req.body, image, gallery });
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({ ...req.body, model: "post" });
  return res.send(data);
};

exports.changeFeatured = async (req, res) => {
  const data = await commonRepository.changeFeatured({ ...req.body, model: "post" });
  return res.send(data);
};

exports.deleteData = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, id: req.params.id, model: "post" });
  return res.send(data);
};

exports.deleteAll = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, model: "post" });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({ ...req.body, model: "post" });
  return res.send(data);
};

exports.manageFavorite = async (req, res) => {
  const data = await repository.manageFavorite(req.body);
  return res.send(data);
};

exports.deleteFileFromArray = async (req, res) => {
  const data = await commonRepository.deleteFileFromArray({
    ...req.body,
    model: "post",
  });
  return res.send(data);
};

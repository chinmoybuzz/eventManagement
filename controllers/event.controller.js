const repository = require("../repository/event.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await repository.list({ ...req.query, ...req.body });
  return res.send(data);
};

exports.details = async (req, res) => {
  const data = await repository.details({ id: req.params.id, ...req.body });
  return res.send(data);
};

exports.addData = async (req, res) => {
  const image = req.files.filter((img) => img.fieldname === "image");
  const gallery = req.files.filter((img) => img.fieldname.startsWith("gallery["));
  const data = await repository.addData({
    ...req.body,
    image: image.length > 0 ? image[0] : null,
    gallery: gallery,
  });
  return res.send(data);
};

exports.updateData = async (req, res) => {
  const image = req.files.filter((img) => img.fieldname === "image");
  const gallery = req.files.filter((img) => img.fieldname.startsWith("gallery["));

  const data = await repository.updateData({
    ...req.body,
    image: image.length > 0 ? image[0] : null,
    gallery: gallery,
  });
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({
    ...req.body,
    model: "event",
  });
  return res.send(data);
};

exports.deleteData = async (req, res) => {
  const data = await commonRepository.remove({
    ...req.body,
    ids: req.params.id,
    model: "event",
  });
  return res.send(data);
};

exports.deleteAll = async (req, res) => {
  const data = await commonRepository.remove({
    ...req.body,
    model: "event",
  });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({
    ...req.body,
    model: "event",
  });
  return res.send(data);
};

exports.manageFavorite = async (req, res) => {
  const data = await repository.manageFavorite(req.body);
  return res.send(data);
};

exports.recomendedList = async (req, res) => {
  const data = await repository.recomendedList({ ...req.query, ...req.body });
  return res.send(data);
};

exports.enroll = async (req, res) => {
  const data = await repository.enroll(req.body);
  return res.send(data);
};

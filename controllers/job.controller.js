const repository = require("../repository/job.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData(req.query);
  return res.send(data);
};

exports.findOneData = async (req, res) => {
  const data = await repository.details({ id: req.params.id, ...req.body });
  return res.send(data);
};

exports.manage = async (req, res) => {
  const data = await repository.manage({ ...req.body, ...req.params });
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({
    ...req.body,
    model: "job",
  });
  return res.send(data);
};

exports.changeFeatured = async (req, res) => {
  const data = await commonRepository.changeFeatured({
    ...req.body,
    model: "job",
  });
  return res.send(data);
};

exports.deleteData = async (req, res) => {
  const data = await commonRepository.remove({
    ...req.body,
    id: req.body.id,
    model: "job",
  });
  return res.send(data);
};

exports.deleteAll = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, model: "job" });
  return res.send(data);
};

exports.jobOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({
    ...req.body,
    model: "job",
  });
  return res.send(data);
};

exports.manageFavorite = async (req, res) => {
  const data = await repository.manageFavorite(req.body);
  return res.send(data);
};

exports.apply = async (req, res) => {
  const data = await repository.apply({ ...req.body, cvFile: req.file });
  return res.send(data);
};

exports.applicationList = async (req, res) => {
  const data = await repository.aplicantfindAllData(req.query);
  return res.send(data);
};
exports.aplicantdetails = async (req, res) => {
  const data = await repository.aplicantdetails(req.params);
  return res.send(data);
};

exports.changeApplicationStatus = async (req, res) => {
  const data = await repository.aplicantchangeStatus(req.body);
  return res.send(data);
};

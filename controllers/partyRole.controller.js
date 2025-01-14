const repository = require("../repository/partyRole.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData({ ...req.query, ...req.body });
  return res.send(data);
};

exports.details = async (req, res) => {
  const data = await repository.findOneData({ ...req.body, ...req.params });
  return res.send(data);
};

exports.manage = async (req, res) => {
  let data = await repository.manage(req.body);
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({
    ...req.body,
    model: "partyRole",
  });
  return res.send(data);
};

exports.deleteData = async (req, res) => {
  const data = await commonRepository.remove({
    ...req.body,
    ids: req.params.id,
    model: "partyRole",
  });
  return res.send(data);
};

exports.deleteAll = async (req, res) => {
  const data = await commonRepository.remove({
    ...req.body,
    model: "partyRole",
  });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({
    ...req.body,
    model: "partyRole",
  });
  return res.send(data);
};

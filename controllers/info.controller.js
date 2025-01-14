const repository = require("../repository/info.repository");
const commonRepository = require("../repository/common.repository");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData(req.query);
  return res.send(data);
};

exports.findOneData = async (req, res) => {
  const data = await repository.findOneData({ id: req.params.id });
  return res.send(data);
};

exports.manage = async (req, res) => {
  const data = await repository.manage(req.body);
  return res.send(data);
};

exports.remove = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, model: "info" });
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({ ...req.body, model: "info" });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({ ...req.body, model: "info" });
  return res.send(data);
};

exports.saveCardsOrdering = async (req, res) => {
  const data = await commonRepository.saveOrderingOfArray({ ...req.body, model: "info", path: "cards" });
  return res.send(data);
};

exports.saveButtonOrdering = async (req, res) => {
  const data = await commonRepository.saveOrderingOfArray({ ...req.body, model: "info", path: "buttons" });
  return res.send(data);
};

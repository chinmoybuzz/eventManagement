const repository = require("../repository/transaction.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.manage = async (req, res) => {
  const data = await repository.manage({ ...req.body });
  return res.send(data);
};

exports.findOneData = async (req, res) => {
  const data = await repository.findOneData({ ...req.params });
  return res.send(data);
};

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData({ ...req.query });
  return res.send(data);
};

exports.remove = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, model: "transaction" });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({ ...req.body, model: "transaction" });
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({ ...req.body, model: "transaction" });
  return res.send(data);
};

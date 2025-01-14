const repository = require("../repository/faq.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData({ ...req.query, ...req.body });
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

exports.helpfulUnhelpful = async (req, res) => {
  const data = await repository.helpfulUnhelpful(req.body);
  return res.send(data);
};

exports.answer = async (req, res) => {
  const data = await repository.answer(req.body);
  return res.send(data);
};

exports.remove = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, model: "faq" });
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({ ...req.body, model: "faq" });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({ ...req.body, model: "faq" });
  return res.send(data);
};

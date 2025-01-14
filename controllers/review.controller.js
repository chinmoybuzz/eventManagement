const repository = require("../repository/review.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData({ ...req.query });
  return res.send(data);
};

exports.findOneData = async (req, res) => {
  const data = await repository.findOneData({ ...req.params });
  return res.send(data);
};

exports.review = async (req, res) => {
  const data = await repository.review(req.query);
  return res.send(data);
};

exports.manage = async (req, res) => {
  const data = await repository.manage({ ...req.body, ...req.params });
  return res.send(data);
};

exports.remove = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, model: "review" });
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({
    ...req.body,
    model: "review",
  });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({
    ...req.body,
    model: "review",
  });
  return res.send(data);
};

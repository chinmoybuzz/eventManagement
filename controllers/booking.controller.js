const repository = require("../repository/booking.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData({ ...req.query, ...req.body });
  return res.send(data);
};

exports.findOneData = async (req, res) => {
  const data = await repository.findOneData({ ...req.body, ...req.params });
  return res.send(data);
};

exports.manage = async (req, res) => {
  const data = await repository.manage(req.body);
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({
    ...req.body,
    model: "booking",
  });
  return res.send(data);
};

exports.remove = async (req, res) => {
  const data = await commonRepository.remove({
    ...req.body,
    ids: req.params.id,
    model: "booking",
  });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({
    ...req.body,
    model: "booking",
  });
  return res.send(data);
};

const repository = require("../repository/enquiry.repository");
const commonRepository = require("../repository/common.repository");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData(req.query);
  return res.send(data);
};

exports.findOneData = async (req, res) => {
  const data = await repository.findOneData({ ...req.body, ...req.params, ...req.query });
  return res.send(data);
};

exports.manage = async (req, res) => {
  const data = await repository.manage({ ...req.body, ...req.params });
  return res.send(data);
};

exports.remove = async (req, res) => {
  const data = await commonRepository.remove({
    ...req.body,
    model: "enquiry",
    id: req.params.id,
  });
  res.send(data);
};

exports.changeStatus = async (req, res) => {
  const data = await commonRepository.changeStatus({
    ...req.body,
    model: "enquiry",
  });
  return res.send(data);
};

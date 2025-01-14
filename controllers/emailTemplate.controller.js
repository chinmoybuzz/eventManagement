const repository = require("../repository/emailTemplate.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await repository.list(req.query);
  return res.send(data);
};

exports.details = async (req, res) => {
  const data = await repository.details(req.query);
  return res.send(data);
};

exports.manage = async (req, res) => {
  const data = await repository.manage(req.body);
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({
    ...req.body,
    model: "emailTemplate",
  });
  return res.send(data);
};

const repository = require("../repository/role.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.manage = async (req, res) => {
  const data = await repository.manage({ ...req.body });
  return res.send(data);
};

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData({ ...req.query });
  return res.send(data);
};

exports.remove = async (req, res) => {
  const data = await commonRepository.remove({ ...req.body, model: "role" });
  return res.send(data);
};

const repository = require("../repository/timezone.repository.js");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData({ ...req.query, ...req.body });
  return res.send(data);
};

exports.details = async (req, res) => {
  const data = await repository.findOneData({ ...req.body, ...req.params });
  return res.send(data);
};

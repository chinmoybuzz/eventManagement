const repository = require("../repository/eventTypes.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData({ ...req.query, ...req.body });
  return res.send(data);
};

exports.details = async (req, res) => {
  const data = await repository.details({ id: req.params.id, ...req.body });
  return res.send(data);
};

// exports.manage = async (req, res) => {
//   const data = await repository.manage({ id: req.params.id, ...req.body });
//   return res.send(data);
// };

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({
    ...req.body,
    model: "eventType",
  });
  return res.send(data);
};

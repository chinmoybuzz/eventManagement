const jobTypeRepository = require("../repository/jobType.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.findAllData = async (req, res) => {
  const data = await jobTypeRepository.list(req.query);
  return res.send(data);
};

exports.details = async (req, res) => {
  const data = await jobTypeRepository.details({ id: req.params.id });
  return res.send(data);
};

exports.manage = async (req, res) => {
  let data = await jobTypeRepository.manage(req.body);
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({
    ...req.body,
    model: "jobType",
  });
  return res.send(data);
};

exports.deleteData = async (req, res) => {
  const data = await commonRepository.remove({
    id: req.params.id,
    ...req.body,
    model: "jobType",
  });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({
    ...req.body,
    model: "jobType",
  });
  return res.send(data);
};

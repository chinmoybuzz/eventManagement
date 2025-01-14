const categoryRepository = require("../repository/category.repository.js");
const commonRepository = require("../repository/common.repository.js");

exports.manage = async (req, res) => {
  let data = await categoryRepository.manage({ ...req.body, file: req.file });
  return res.send(data);
};

exports.findAllData = async (req, res) => {
  const data = await categoryRepository.findAllData(req.query);
  return res.send(data);
};

exports.findOneData = async (req, res) => {
  const data = await categoryRepository.findOneData({ id: req.params.id });
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({
    ...req.body,
    model: "category",
  });
  return res.send(data);
};

exports.remove = async (req, res) => {
  const data = await commonRepository.remove({
    id: req.params.id,
    ...req.body,
    model: "category",
  });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({
    ...req.body,
    model: "category",
  });
  return res.send(data);
};

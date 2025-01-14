const repository = require("../repository/siteSetting.repository");

exports.findOneData = async (req, res) => {
  const data = await repository.findOneData(req.params);
  return res.send(data);
};

exports.edit = async (req, res) => {
  const data = await repository.edit({
    ...req.body,
    logo: req.files?.logo?.length > 0 ? req.files.logo[0] : null,
    favicon: req.files?.favicon?.length > 0 ? req.files.favicon[0] : null,
  });
  return res.send(data);
};

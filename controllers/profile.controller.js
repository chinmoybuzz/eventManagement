const repository = require("../repository/profile.repository");

exports.profile = async (req, res) => {
  const data = await repository.profile({ ...req.params, ...req.query, ...req.body });
  return res.send(data);
};

exports.profileImage = async (req, res) => {
  const image = req.files.filter((img) => img.fieldname.startsWith("image"));
  const data = await repository.profileImage({ ...req.body, image });
  return res.send(data);
};

exports.profileUpdate = async (req, res) => {
  const data = await repository.profileUpdate(req.body);
  return res.send(data);
};

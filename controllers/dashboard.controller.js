const repository = require("../repository/dashboard.repository.js");

const details = async (req, res) => {
  const data = await repository.details({ ...req.body, ...req.query });
  return res.send(data);
};

module.exports = { details };

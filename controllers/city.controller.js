const categoryRepository = require("../repository/category.repository.js");
const cityRepository = require("../repository/city.repository.js");

exports.findAllData = async (req, res) => {
  const data = await cityRepository.findAllData(req.query);
  return res.send(data);
};

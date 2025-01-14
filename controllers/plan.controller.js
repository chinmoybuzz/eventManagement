const repository = require("../repository/plan.repository.js");
const commonRepository = require("../repository/common.repository.js");
const subscriptionRepository = require("../repository/subscription.repository.js");
const logger = require("../helper/logger.js");

exports.findAllData = async (req, res) => {
  const data = await repository.findAllData({ ...req.query, ...req.body });
  return res.send(data);
};

exports.details = async (req, res) => {
  const data = await repository.findOneData({ ...req.query, ...req.params });
  return res.send(data);
};

exports.manage = async (req, res) => {
  const data = await repository.manage(req.body);
  return res.send(data);
};

exports.statusChange = async (req, res) => {
  const data = await commonRepository.changeStatus({
    ...req.body,
    model: "plan",
  });
  return res.send(data);
};

exports.deleteData = async (req, res) => {
  const data = await commonRepository.remove({
    ...req.body,
    ids: req.params.id,
    model: "plan",
  });
  return res.send(data);
};

exports.deleteAll = async (req, res) => {
  const data = await commonRepository.remove({
    ...req.body,
    model: "plan",
  });
  return res.send(data);
};

exports.saveOrdering = async (req, res) => {
  const data = await commonRepository.saveOrdering({
    ...req.body,
    model: "plan",
  });
  return res.send(data);
};

exports.subscribe = async (req, res) => {
  const data = await subscriptionRepository.subscribePlan({
    ...req.body,
    ...req.params,
  });
  return res.send(data);
};

exports.subscribeList = async (req, res) => {
  const data = await subscriptionRepository.subscribeList({
    ...req.params,
    ...req.query,
  });
  return res.status(200).send(data);
};

exports.stripeWebhook = async (req, res) => {
  const event = req.body;
  logger.build({ fileName: "stripe-webhook" }).info(event);
  return res.send({});
};

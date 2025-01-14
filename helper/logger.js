const log4js = require("log4js");
const fs = require("fs");
const path = require("path");

const date = new Date();
const fileName = path.join(__dirname, "../logs/error-" + (date.getMonth() + 1) + "-" + date.getFullYear() + ".log");

!fs.existsSync(fileName) && fs.appendFile(fileName, "", (e) => {});

log4js.configure({
  appenders: { monthly: { type: "file", filename: fileName } },
  categories: { default: { appenders: ["monthly"], level: "error" } },
});

const logger = log4js.getLogger("monthly");

const error = (...params) => {
  logger.error(params);
};
const info = (...params) => {
  logger.info(params);
};
const trace = (...params) => {
  logger.trace(params);
};
const debug = (...params) => {
  logger.debug(params);
};

const build = ({ fileName, level = "info", type = "monthly" }) => {
  fileName = path.join(__dirname, `../logs/${fileName}.log`);
  log4js.configure({
    appenders: { monthly: { type: "file", filename: fileName } },
    categories: { default: { appenders: [type], level: level } },
  });

  return log4js.getLogger(type);
};

module.exports = { logger, error, info, debug, trace, build };

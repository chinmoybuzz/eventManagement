const logger = require("./logger");

module.exports = (error, params) => {
  if (error.name === "ValidationError") {
    for (const field in error.errors) {
      validationErrors = error.errors[field].message;
    }
    return { status: 400, message: validationErrors };
  }

  if (error.code && error.code === 11000) {
    return {
      status: 400,
      message: `${Object.keys(error.keyValue)[0]} already exists.`,
    };
  }

  params = JSON.stringify(params);
  logger.error({ params, error });
  return { status: 500, message: error.message, error };
};

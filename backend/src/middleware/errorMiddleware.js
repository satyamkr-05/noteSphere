import { AppError } from "../utils/appError.js";
import { NOTE_FILE_SIZE_LABEL } from "../../../shared/noteLimits.js";

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
}

function normalizeError(error, fallbackStatusCode) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      details: error.details
    };
  }

  if (error.type === "entity.parse.failed") {
    return {
      statusCode: 400,
      message: "Invalid JSON body. Please check your request payload."
    };
  }

  if (error.message === "Origin not allowed by CORS.") {
    return {
      statusCode: 403,
      message: error.message
    };
  }

  if (error.name === "ValidationError") {
    return {
      statusCode: 400,
      message: Object.values(error.errors)
        .map((item) => item.message)
        .join(" ")
    };
  }

  if (error.name === "CastError") {
    return {
      statusCode: 400,
      message: `Invalid ${error.path}.`
    };
  }

  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0] || "value";
    return {
      statusCode: 409,
      message: `${duplicateField} already exists.`
    };
  }

  if (error.name === "MulterError") {
    return {
      statusCode: 400,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? `File is too large. Maximum allowed size is ${NOTE_FILE_SIZE_LABEL}.`
          : error.message || "There was a problem uploading the file."
    };
  }

  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    return {
      statusCode: 401,
      message: "Invalid or expired token."
    };
  }

  if (error.name === "MongooseServerSelectionError") {
    return {
      statusCode: 503,
      message: "Unable to reach the database right now. Please try again in a moment."
    };
  }

  return {
    statusCode: fallbackStatusCode,
    message: error.message || "Something went wrong."
  };
}

export function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const fallbackStatusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const normalizedError = normalizeError(error, fallbackStatusCode);

  res.status(normalizedError.statusCode).json({
    success: false,
    message: normalizedError.message,
    details: normalizedError.details,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined
  });
}

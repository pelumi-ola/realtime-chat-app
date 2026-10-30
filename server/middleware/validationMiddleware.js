import { validationResult } from "express-validator";
import { errorResponse } from "../utils/response.js";

export function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    return errorResponse(res, 422, "Validation failed", errors);
  }

  next();
}

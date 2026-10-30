import { body, param, query } from "express-validator";

export const messageIdValidator = [
  param("messageId").isMongoId().withMessage("Invalid message ID"),
];

export const messageHistoryValidator = [
  param("roomId").isMongoId().withMessage("Invalid room ID"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

export const sendMessageValidator = [
  body("content")
    .isString()
    .withMessage("Message content must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Message content is required")
    .isLength({ max: 5000 })
    .withMessage("Message cannot exceed 5000 characters"),

  body("roomId").isMongoId().withMessage("A valid room ID is required"),
];

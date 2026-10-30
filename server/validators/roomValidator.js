import { body, param } from "express-validator";

export const createRoomValidator = [
  body("groupName")
    .isString()
    .withMessage("Room name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Room name is required")
    .isLength({ min: 2, max: 60 })
    .withMessage("Room name must be between 2 and 60 characters"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
];

export const updateRoomValidator = [
  param("id").isMongoId().withMessage("Invalid room ID"),

  body("groupName")
    .optional()
    .isString()
    .withMessage("Room name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Room name cannot be empty")
    .isLength({ min: 2, max: 60 })
    .withMessage("Room name must be between 2 and 60 characters"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
];

export const roomIdValidator = [
  param("roomId").isMongoId().withMessage("Invalid room ID"),
];

export const roomParamValidator = [
  param("id").isMongoId().withMessage("A valid room ID is required"),
];

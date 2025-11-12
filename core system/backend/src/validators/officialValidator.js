import { body } from "express-validator";

export const registerOfficialRules = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 chars"),
  body("fullName").isLength({ min: 3 }).withMessage("Full name required"),
  body("role").isIn(["Chairman", "Treasurer"]).withMessage("Invalid role"),
  body("token").isString().notEmpty().withMessage("Invite token required"),
  body("walletAddress").matches(/^0x[a-fA-F0-9]{40}$/).withMessage("Invalid wallet address"),

  body("phoneNumber")
    .matches(/^\+639\d{9}$/)
    .withMessage("Invalid Philippine phone number format (+639XXXXXXXXX)")
];

export const loginRules = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required"),
];

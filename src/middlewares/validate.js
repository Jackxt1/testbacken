const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Must be at least 8 characters')
    .matches(/[0-9]/).withMessage('Must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('Must contain at least one letter'),
  body('role')
    .optional()
    .isIn(['admin', 'user']).withMessage('Role must be admin or user'),
  handleValidation,
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const updateUserRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('Must be at least 8 characters')
    .matches(/[0-9]/).withMessage('Must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('Must contain at least one letter'),
  body('role')
    .optional()
    .isIn(['admin', 'user']).withMessage('Role must be admin or user'),
  handleValidation,
];

const statusRules = [
  body('is_active').isBoolean().withMessage('is_active must be boolean'),
  handleValidation,
];

module.exports = { registerRules, loginRules, updateUserRules, statusRules };

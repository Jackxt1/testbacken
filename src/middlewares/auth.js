const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const revoked = await TokenBlacklist.findOne({ where: { token } });
    if (revoked) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token revoked'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token'
    });
  }
};

exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions'
      });
    }
    next();
  };
};

exports.requireAdminOrOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const isOwner = req.user.id.toString() === req.params.id;
  const isAdmin = req.user.role === 'admin';

  if (isOwner || isAdmin) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access denied'
    });
  }
};
//ตรวจสอบ Token (JWT) ว่าล็อกอินหรือยัง
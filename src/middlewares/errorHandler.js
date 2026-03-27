const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  // บันทึก Error ลง log ถ้ามี logger
  if (logger && typeof logger.error === 'function') {
    logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  } else {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
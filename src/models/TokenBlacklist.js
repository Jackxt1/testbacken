const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TokenBlacklist = sequelize.define('TokenBlacklist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

module.exports = TokenBlacklist;

//เก็บ Token ที่ถูกสั่งยกเลิก (เช่น หลัง Logout)
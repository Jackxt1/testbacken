const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authController = {
  register: async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const errors = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name || name.length < 2 || name.length > 100) {
        errors.push({ field: 'name', message: 'Name must be 2-100 characters' });
      }
      if (!emailRegex.test(email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
      if (password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
      }
      if (!/\d/.test(password)) {
        errors.push({ field: 'password', message: 'Password must contain at least one number' });
      }
      if (!/[a-zA-Z]/.test(password)) {
        errors.push({ field: 'password', message: 'Password must contain at least one letter' });
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
          timestamp: new Date().toISOString(),
        });
      }

      const normalizedEmail = email.toLowerCase();
      const existingUser = await User.findOne({ where: { email: normalizedEmail } });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }

      const user = await User.create({ name, email: normalizedEmail, password });

      res.status(201).json({
        success: true,
        data: { user: user.toSafeJSON() },
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email: email.toLowerCase() } });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const accessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );
      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      // บันทึก refresh token ลง DB
      user.refresh_token = refreshToken;
      await user.save();

      res.status(200).json({
        success: true,
        data: { accessToken, refreshToken, user: user.toSafeJSON() },
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await TokenBlacklist.create({ token });

        // ลบ refresh token ออกจาก DB
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await User.update({ refresh_token: null }, { where: { id: decoded.id } });
      }
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    }
  },

  me: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.status(200).json({ success: true, data: { user: user.toSafeJSON() } });
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token required' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user || user.refresh_token !== refreshToken) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
      }

      const accessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      res.status(200).json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
  },
};

module.exports = authController;

//จัดการ Login/Register
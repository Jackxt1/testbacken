const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const SALT_ROUNDS = 12;
const ALLOWED_SORT = ['created_at', 'name', 'email'];
const ALLOWED_ORDER = ['asc', 'desc'];

class UserService {
  async getAll({ page = 1, limit = 10, search, role, sort = 'created_at', order = 'desc' }) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const sortField = ALLOWED_SORT.includes(sort) ? sort : 'created_at';
    const sortOrder = ALLOWED_ORDER.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (role && ['admin', 'user'].includes(role)) {
      where.role = role;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'refresh_token'] },
      order: [[sortField, sortOrder]],
      limit: limitNum,
      offset,
    });

    return {
      users: rows,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalItems: count,
        itemsPerPage: limitNum,
      },
    };
  }

  async getById(id) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'refresh_token'] },
    });
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return user;
  }

  async update(id, data) {
    const user = await User.findByPk(id);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.email) {
      const emailLower = data.email.toLowerCase();
      const conflict = await User.findOne({ where: { email: emailLower } });
      if (conflict && conflict.id !== parseInt(id)) {
        const err = new Error('Email already in use');
        err.status = 409;
        err.field = 'email';
        throw err;
      }
      updateData.email = emailLower;
    }
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }
    if (data.role) updateData.role = data.role;

    await user.update(updateData);
    return user.toSafeJSON();
  }

  async remove(id) {
    const user = await User.findByPk(id);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    await user.destroy();
  }

  async setStatus(id, is_active) {
    const user = await User.findByPk(id);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    await user.update({ is_active });
    return user.toSafeJSON();
  }
}

module.exports = new UserService();

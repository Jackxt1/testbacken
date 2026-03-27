const { Op } = require('sequelize');
const User = require('../models/User');

// 1. ดึงข้อมูลผู้ใช้ทั้งหมด (พร้อมทำ Pagination + Filtering + Sorting)
exports.getAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const { search, role, sort = 'createdAt', order = 'desc' } = req.query;

    // ── Where Clause ──────────────────────────────────────────────
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

    // ── Sort ──────────────────────────────────────────────────────
    const allowedSort = ['createdAt', 'name', 'email'];
    const allowedOrder = ['asc', 'desc'];
    const sortField = allowedSort.includes(sort) ? sort : 'createdAt';
    const sortOrder = allowedOrder.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
      attributes: { exclude: ['password', 'refresh_token'] },
    });

    res.status(200).json({
      success: true,
      data: {
        users: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// 2. ดึงข้อมูลผู้ใช้ตาม ID
exports.getById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      data: { user: user.toSafeJSON() },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// 3. อัปเดตข้อมูลผู้ใช้
exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password;
    if (req.body.role && req.user.role === 'admin') user.role = req.body.role;

    await user.save();

    res.status(200).json({
      success: true,
      data: { user: user.toSafeJSON() },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// 4. ลบผู้ใช้
exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// 5. เปิด/ปิด สถานะผู้ใช้
exports.setStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.body.is_active !== undefined) {
      user.is_active = req.body.is_active;
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: { user: user.toSafeJSON() },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
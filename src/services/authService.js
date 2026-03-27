require('dotenv').config({ path: '.env.example' });
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

// 1. Mock แค่ Database ให้เป็น SQLite In-Memory
jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});

const request = require('supertest');
const bcrypt = require('bcryptjs');

// 2. Import ของจริงมาเลยครับ (มันจะไปเชื่อมกับ SQLite ที่เรา Mock ไว้ข้างบนเอง)
const db = require('../src/config/database');
const User = require('../src/models/User');
const TokenBlacklist = require('../src/models/TokenBlacklist');
const app = require('../src/app');

beforeAll(async () => {
  // เติมฟังก์ชัน toSafeJSON ให้กับ Model ของจริง (เผื่อใน Model หลักยังไม่มี)
  if (!User.prototype.toSafeJSON) {
    User.prototype.toSafeJSON = function () {
      const v = { ...this.get() };
      delete v.password;
      delete v.refresh_token;
      return v;
    };
  }

  // สร้างตารางใหม่ทั้งหมดใน SQLite
  await db.sync({ force: true });

  // สร้าง Admin User เอาไว้เทสต์
  await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: await bcrypt.hash('Admin@1234', 10),
    role: 'admin',
    is_active: true,
  });
});

afterAll(async () => {
  await db.close();
});

describe('POST /api/auth/register', () => {
  it('TC-01: should register a new user with valid data', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Alice', email: 'alice@test.com', password: 'Alice@123' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@test.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('TC-02: should return 409 when email already in use', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Bob', email: 'bob@test.com', password: 'Bob@12345' });
    const res = await request(app).post('/api/auth/register').send({ name: 'Bob2', email: 'bob@test.com', password: 'Bob@12345' });
    expect(res.status).toBe(409);
  });

  it('TC-03: should return 400 when email format is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Charlie', email: 'not-an-email', password: 'Charlie@123' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.field === 'email')).toBe(true);
  });

  it('TC-04: should return 400 when password has no number', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Dave', email: 'dave@test.com', password: 'onlyletters' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.field === 'password')).toBe(true);
  });

  it('TC-05: should return 400 when password too short', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Eve', email: 'eve@test.com', password: 'Ab1' });
    expect(res.status).toBe(400);
  });

  it('TC-06: should store email in lowercase', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Frank', email: 'FRANK@Test.COM', password: 'Frank@123' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('frank@test.com');
  });
});

describe('POST /api/auth/login', () => {
  it('TC-07: should login with correct credentials and return tokens', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('TC-08: should return 401 with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Wrong@1234' });
    expect(res.status).toBe(401);
  });

  it('TC-09: should return 401 when email not found', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'Nobody@123' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  let accessToken;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
    accessToken = res.body.data.accessToken;
  });

  it('TC-10: should logout and return 204', async () => {
    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(204);
  });

  it('TC-11: should reject revoked token after logout', async () => {
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${accessToken}`);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(401);
  });
});

describe('Authorization', () => {
  let adminToken, userToken, userId;

  beforeAll(async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: 'Regular', email: 'regular@test.com', password: 'User@1234' });
    userId = reg.body.data.user.id;

    // ล้าง blacklist ก่อน login ใหม่
    await TokenBlacklist.destroy({ where: {} });

    const loginAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
    adminToken = loginAdmin.body.data.accessToken;
    const loginUser = await request(app).post('/api/auth/login').send({ email: 'regular@test.com', password: 'User@1234' });
    userToken = loginUser.body.data.accessToken;
  });

  it('TC-12: should return 401 when calling protected route without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('TC-13: should return 403 when regular user tries to delete another user', async () => {
    const res = await request(app).delete('/api/users/1').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('TC-14: admin can delete a user successfully', async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: 'ToDelete', email: 'todelete@test.com', password: 'Delete@123' });
    const deleteId = reg.body.data.user.id;
    const res = await request(app).delete(`/api/users/${deleteId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });

  it('TC-15: user can view their own profile', async () => {
    const res = await request(app).get(`/api/users/${userId}`).set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('regular@test.com');
  });
});

describe('CRUD & Pagination', () => {
  let adminToken, userId;

  beforeAll(async () => {
    // ล้าง blacklist ก่อน login ใหม่
    await TokenBlacklist.destroy({ where: {} });

    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
    adminToken = res.body.data.accessToken;
    const reg = await request(app).post('/api/auth/register').send({ name: 'PageUser', email: 'page@test.com', password: 'Page@1234' });
    userId = reg.body.data.user.id;
  });

  it('TC-16: admin can get paginated user list', async () => {
    const res = await request(app).get('/api/users?page=1&limit=5').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.currentPage).toBe(1);
    expect(res.body.data.users).toBeInstanceOf(Array);
  });

  it('TC-17: user can update their own name', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'page@test.com', password: 'Page@1234' });
    const token = loginRes.body.data.accessToken;
    const res = await request(app).put(`/api/users/${userId}`).set('Authorization', `Bearer ${token}`).send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Name');
  });

  it('TC-18: should return 404 when user not found', async () => {
    const res = await request(app).get('/api/users/99999').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
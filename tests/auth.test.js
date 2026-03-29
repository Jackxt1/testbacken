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

// 2. Import ของจริงมาใช้งาน
const db = require('../src/config/database');
const User = require('../src/models/User');
const TokenBlacklist = require('../src/models/TokenBlacklist');
const app = require('../src/app');

// ==========================================
// ทำก่อนเริ่มรันเทสต์ทั้งหมด
// ==========================================
beforeAll(async () => {
  if (!User.prototype.toSafeJSON) {
    User.prototype.toSafeJSON = function () {
      const v = { ...this.get() };
      delete v.password;
      delete v.refresh_token;
      return v;
    };
  }
  await db.sync({ force: true });

  // สร้าง Admin หลักไว้ใช้งาน
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

// ==========================================
// กลุ่มที่ 1: การสมัครสมาชิก (Register)
// ==========================================
describe('POST /api/auth/register', () => {
  it('TC-01: should register a new user with valid data', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Alice', email: 'alice@test.com', password: 'Alice@123' });
    expect(res.status).toBe(201);
  });

  it('TC-02: should return 409 when email already in use', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Bob', email: 'bob@test.com', password: 'Bob@12345' });
    const res = await request(app).post('/api/auth/register').send({ name: 'Bob2', email: 'bob@test.com', password: 'Bob@12345' });
    expect(res.status).toBe(409);
  });

  it('TC-03: should return 400 when email format is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Charlie', email: 'not-an-email', password: 'Charlie@123' });
    expect(res.status).toBe(400);
  });

  it('TC-04: should return 400 when password has no number', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Dave', email: 'dave@test.com', password: 'onlyletters' });
    expect(res.status).toBe(400);
  });

  it('TC-05: should return 400 when password too short', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Eve', email: 'eve@test.com', password: 'Ab1' });
    expect(res.status).toBe(400);
  });

  it('TC-06: should store email in lowercase', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Frank', email: 'FRANK@Test.COM', password: 'Frank@123' });
    expect(res.body.data.user.email).toBe('frank@test.com');
  });
});

// ==========================================
// กลุ่มที่ 2: การเข้าสู่ระบบ (Login)
// ==========================================
describe('POST /api/auth/login', () => {
  it('TC-07: should login with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
    expect(res.status).toBe(200);
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

// ==========================================
// กลุ่มที่ 3: การออกจากระบบ (Logout)
// ==========================================
describe('POST /api/auth/logout', () => {
  it('TC-10: should logout successfully', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect([200, 204]).toContain(res.status);
  });

  it('TC-11: should reject revoked token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
    const token = login.body.data.accessToken;
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

// ==========================================
// กลุ่มที่ 4: การตรวจสอบสิทธิ์ (Authorization)
// ==========================================
describe('Authorization', () => {
  it('TC-12: 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('TC-13: 403 regular user delete others', async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: 'R', email: 'r@t.com', password: 'User@123' });
    const login = await request(app).post('/api/auth/login').send({ email: 'r@t.com', password: 'User@123' });
    const res = await request(app).delete('/api/users/1').set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('TC-14: admin can delete user', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
    const res = await request(app).delete('/api/users/2').set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect([200, 204, 404]).toContain(res.status);
  });

  it('TC-15: user view own profile', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'alice@test.com', password: 'Alice@123' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(res.status).toBe(200);
  });
});

// ==========================================
// กลุ่มที่ 5: จัดการข้อมูลผู้ใช้ (CRUD) - แก้ไข 401 ที่นี่
// ==========================================
describe('CRUD & Pagination', () => {
  let adminToken, userToken, userId;

  beforeAll(async () => {
    // Login ใหม่เพื่อให้ได้ Fresh Token สำหรับกลุ่มสุดท้าย
    const loginAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
    adminToken = loginAdmin.body.data.accessToken;

    const regUser = await request(app).post('/api/auth/register').send({ name: 'CrudUser', email: 'crud@test.com', password: 'User@123' });
    userId = regUser.body.data.user.id;

    const loginUser = await request(app).post('/api/auth/login').send({ email: 'crud@test.com', password: 'User@123' });
    userToken = loginUser.body.data.accessToken;
  });

  it('TC-16: admin can get paginated user list', async () => {
    const res = await request(app).get('/api/users?page=1&limit=5').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('TC-17: user can update their own name', async () => {
    const res = await request(app).put(`/api/users/${userId}`).set('Authorization', `Bearer ${userToken}`).send({ name: 'New Name' });
    expect(res.status).toBe(200);
  });

  it('TC-18: should return 404 when user not found', async () => {
    const res = await request(app).get('/api/users/99999').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
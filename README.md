# User Management System API

RESTful API สำหรับ User Management System — สหกิจศึกษา Backend Developer  
**Stack:** Node.js + Express.js · MySQL · JWT · Docker

---

## 1. ติดตั้งและรัน (Docker Compose)

```bash
# 1. Clone repo
git clone <your-repo-url> && cd user-management

# 2. คัดลอก env
cp .env.example .env
# แก้ไข JWT_SECRET และ JWT_REFRESH_SECRET ให้เป็นค่าที่ปลอดภัย

# 3. รัน (ครั้งเดียวจบ)
docker compose up --build
```

API พร้อมใช้งานที่ `http://localhost:3000`  
Adminer (DB GUI) ที่ `http://localhost:8080`

---

## 2. Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | App port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | MySQL host | `db` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `userdb` |
| `DB_USER` | DB username | `appuser` |
| `DB_PASSWORD` | DB password | `changeme` |
| `DB_ROOT_PASSWORD` | MySQL root password | `rootpassword` |
| `JWT_SECRET` | Access token secret | `your-secret` |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `your-refresh-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `60000` |
| `RATE_LIMIT_MAX` | Max login attempts per window | `5` |

---

## 3. Database Migration & Seed

Migration และ Seed ทำงานอัตโนมัติเมื่อ MySQL container เริ่มต้นผ่าน  
`docker-entrypoint-initdb.d/` (ไฟล์ `migrations/init.sql` และ `seeders/seed.sql`)

รันด้วยตัวเองสำหรับ local development:
```bash
mysql -h 127.0.0.1 -u appuser -p userdb < migrations/init.sql
mysql -h 127.0.0.1 -u appuser -p userdb < seeders/seed.sql
```

---

## 4. รัน Test Suite

```bash
npm test
# หรือดู coverage
npm test -- --coverage
```

ต้องผ่านอย่างน้อย 18 test cases และ coverage ≥ 60%

---

## 5. API Documentation (Swagger)

เข้าถึงได้ที่: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

รองรับ Authentication ผ่าน **Bearer Token** — กด Authorize แล้วใส่ `<accessToken>`

---

## 6. Test Accounts (จาก Seed Data)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Admin@1234` |
| User | `user@example.com` | `User@1234` |

---

## 7. Technology Stack

| เทคโนโลยี | เหตุผลที่เลือก |
|---|---|
| **Node.js + Express.js** | เร็ว เบา เหมาะกับ REST API และ ecosystem ขนาดใหญ่ |
| **MySQL 8** | นิยมใช้ในองค์กร รองรับ ENUM, Transaction และ Full-text search ได้ดี |
| **Sequelize ORM** | รองรับ Migration, Validation และ Type-safety บน MySQL |
| **JWT (jsonwebtoken)** | Stateless auth ที่ปรับขนาดได้ง่าย |
| **bcryptjs** | Hash password ด้วย salt rounds ≥ 10 ปลอดภัยจาก brute-force |
| **Helmet.js** | ตั้งค่า HTTP Security Headers อัตโนมัติ |
| **express-rate-limit** | ป้องกัน brute-force บน `/api/auth/login` |
| **Jest + Supertest** | Integration test ที่ครอบคลุม ไม่ต้องการ DB จริงในการทดสอบ |
| **swagger-jsdoc** | สร้าง API Docs จาก JSDoc annotation โดยตรง |

---

## 8. API Endpoints Summary

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | สมัครสมาชิก |
| POST | `/api/auth/login` | Public | เข้าสู่ระบบ (rate limited) |
| POST | `/api/auth/logout` | Required | ออกจากระบบ (blacklist token) |
| GET | `/api/auth/me` | Required | ดูข้อมูลตัวเอง |
| POST | `/api/auth/refresh` | Refresh Token | ต่ออายุ Access Token |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | ดึงรายการผู้ใช้ (pagination) |
| GET | `/api/users/:id` | Admin/Owner | ดึงข้อมูลผู้ใช้รายบุคคล |
| PUT | `/api/users/:id` | Admin/Owner | อัปเดตข้อมูลผู้ใช้ |
| DELETE | `/api/users/:id` | Admin | ลบผู้ใช้ |
| PATCH | `/api/users/:id/status` | Admin | เปิด/ปิด Account |

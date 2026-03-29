POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "newuser@example.com",
  "password": "Password123",
}
เทส สมัคร

POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456"
}
เทส ล็อคอิน

GET http://localhost:3000/api/auth/me
Authorization: Bearer <accessToken> token ตัวเอง
ดูข้อมูลของตัวเอง

POST http://localhost:3000/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refreshToken>" เอาtoken มารีเฟชร
}

POST http://localhost:3000/api/auth/logout
Authorization: Bearer <accessToken> 

GET http://localhost:3000/api/users?page=1&limit=10
Authorization: Bearer <accessToken> ใช้token ที่เป็น admin

GET http://localhost:3000/api/users/1
Authorization: Bearer <accessToken> ดึงเดี่ยว

PUT http://localhost:3000/api/users/1
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com"
}
อัปเดตข้อมูล user

DELETE http://localhost:3000/api/users/1
Authorization: Bearer <accessToken>
ลบ user

PATCH http://localhost:3000/api/users/1/status
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "is_active": false **เปิดปิด ปิดfalse เปิด true
}

การเช้คตาราง
docker compose exec db mysql -u appuser -pchangeme userdb -e "DESCRIBE Users;"

Input Validation & Error Handling การเช้ค

POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123",
  "is_active": true
}
{
  "name": "A",
  "email": "test@example.com",
  "password": "Password123",
  "is_active": true
}
{
  "name": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "email": "test@example.com",
  "password": "Password123",
  "is_active": true
}

เทส Pagination & Filtering

Pagination พื้นฐาน
GET http://localhost:3000/api/users?page=1&limit=10
Authorization: Bearer <accessToken admin>

เปลี่ยน page
GET http://localhost:3000/api/users?page=2&limit=3
Authorization: Bearer <accessToken admin>

Search ตามชื่อ
GET http://localhost:3000/api/users?search=admin
Authorization: Bearer <accessToken admin>

Filter ตาม role
GET http://localhost:3000/api/users?role=admin
Authorization: Bearer <accessToken admin>

Sort ตามชื่อ
GET http://localhost:3000/api/users?sort=name&order=asc
Authorization: Bearer <accessToken admin>

 Security เทส

 1. bcrypt — เช็คใน Adminer
http://localhost:8080
เข้า DB → table users → ดู column password ต้องขึ้น $2b$10$... ✅

2. ไม่ส่ง Password กลับใน Response
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123"
}
✅ ต้องไม่มี field password ใน response

3. Rate Limiting — ยิง 6 ครั้งติดกัน
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "wrongpassword"
}
✅ ครั้งที่ 6 ต้องได้ 429 Too Many Requests

4. Helmet — Security Headers
GET http://localhost:3000/health
คลิก Headers ใน Response ต้องเห็น

X-Content-Type-Options: nosniff ✅
X-Frame-Options: SAMEORIGIN ✅
X-XSS-Protection: 0 ✅
Strict-Transport-Security ✅


5. Environment Variables
เช็คไฟล์ .env มี

JWT_SECRET ✅
JWT_REFRESH_SECRET ✅
DB_PASSWORD ✅

ไม่มี secret อยู่ในโค้ดตรงๆ ✅

6. CORS
GET http://localhost:3000/health
ดู Response Headers จะเห็น Access-Control-Allow-Origin ✅
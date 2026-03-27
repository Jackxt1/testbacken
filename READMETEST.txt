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
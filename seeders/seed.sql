USE userdb;

INSERT INTO Users (name, email, password, role, is_active)
VALUES (
  'Admin User',
  'admin@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  TRUE
);
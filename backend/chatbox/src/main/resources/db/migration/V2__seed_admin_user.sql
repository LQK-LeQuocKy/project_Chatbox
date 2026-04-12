INSERT INTO users(username, password, full_name, email, phone, enabled)
VALUES (
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Quản trị viên',
    'admin@shop.com',
    '0123456789',
    true
);

INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin'
  AND r.name = 'ROLE_ADMIN';
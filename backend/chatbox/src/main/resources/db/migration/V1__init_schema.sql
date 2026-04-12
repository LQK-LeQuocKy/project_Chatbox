CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    short_description TEXT,
    details TEXT,
    price DECIMAL(12,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    badge VARCHAR(50),
    material VARCHAR(150),
    colors VARCHAR(255),
    sizes VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    category_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE chatbot_scenarios (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    question_pattern VARCHAR(500) NOT NULL,
    keywords VARCHAR(500),
    answer TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE chat_conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT,
    session_code VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    CONSTRAINT fk_chat_conversations_user FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE TABLE chat_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    sender_id BIGINT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id)
);

CREATE TABLE chat_unresolved (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    customer_message_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    admin_reply TEXT,
    admin_id BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    replied_at DATETIME NULL,
    CONSTRAINT fk_chat_unresolved_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),
    CONSTRAINT fk_chat_unresolved_message FOREIGN KEY (customer_message_id) REFERENCES chat_messages(id),
    CONSTRAINT fk_chat_unresolved_admin FOREIGN KEY (admin_id) REFERENCES users(id)
);

INSERT INTO roles(name) VALUES ('ROLE_ADMIN'), ('ROLE_STAFF'), ('ROLE_CUSTOMER');

INSERT INTO categories(name, slug, description) VALUES
('Áo sơ mi', 'ao-so-mi', 'Các mẫu áo sơ mi nam'),
('Quần tây', 'quan-tay', 'Các mẫu quần tây nam'),
('Vest', 'vest', 'Các mẫu vest nam'),
('Giày', 'giay', 'Các mẫu giày nam'),
('Cà vạt', 'ca-vat', 'Các mẫu cà vạt nam');

INSERT INTO chatbot_scenarios(title, question_pattern, keywords, answer, active) VALUES
('Giờ mở cửa', 'gio mo cua', 'giờ mở cửa, mấy giờ mở cửa, shop mở cửa', 'Shop mở cửa từ 8:00 đến 22:00 mỗi ngày.', true),
('Địa chỉ shop', 'dia chi', 'địa chỉ, cửa hàng ở đâu, shop ở đâu', 'Shop hiện hỗ trợ bán online và có thể cập nhật địa chỉ showroom ở trang giới thiệu.', true),
('Chính sách đổi trả', 'doi tra', 'đổi trả, hoàn hàng, đổi size', 'Shop hỗ trợ đổi size nếu sản phẩm còn nguyên tem mác và chưa qua sử dụng.', true),
('Tư vấn size', 'size', 'size, chọn size, tư vấn size', 'Bạn hãy cung cấp chiều cao và cân nặng, shop sẽ tư vấn size phù hợp cho bạn.', true);
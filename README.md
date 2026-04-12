# 🧥 Chatbox MenFashion Shop

## 📖 Giới thiệu

**Chatbox MenFashion Shop** là một hệ thống website bán hàng thời trang nam tích hợp chatbot thông minh, giúp hỗ trợ khách hàng nhanh chóng thông qua các kịch bản có sẵn.

Người dùng có thể hỏi về:

* Size sản phẩm
* Giá
* Phối đồ
* Chính sách đổi trả
* Tình trạng sản phẩm

Ngoài ra, hệ thống còn hỗ trợ admin quản lý toàn bộ hoạt động.

---

## 🚀 Chức năng chính

### 👤 Người dùng (User)

* Đăng ký / Đăng nhập
* Xem sản phẩm
* Chatbot tư vấn tự động
* Liên hệ
* Gợi ý sản phẩm

### 🛠️ Quản trị viên (Admin)

* Quản lý người dùng
* Dashboard thống kê
* Biểu đồ hệ thống
* Quản lý kịch bản chatbot
* Trả lời chat khách hàng

---

## 🧰 Công nghệ sử dụng

### Frontend

* HTML
* CSS
* JavaScript (thuần)

### Backend

* Java
* Spring Boot

### Database

* MySQL

### Công cụ

* IntelliJ IDEA (Backend)
* VS Code (Frontend)
* MySQL Workbench

---

## 📁 Cấu trúc thư mục

```
project_Chatbox/
│
├── frontend/Chatbox        # Giao diện web
├── chatbox/         # Backend (Spring Boot)
├── database/Chatbox        # File SQL
```

---

## ⚙️ Yêu cầu hệ thống

* Java: `21.0.7`
* MySQL: `9.4.0`
* Maven
* Google Chrome
* Live Server (VS Code)

---

## 🗄️ Cài đặt Database

### Bước 1: Tạo database

```sql
CREATE DATABASE mensfashion_shop;
```

### Bước 2: Import dữ liệu

* Mở **MySQL Workbench**
* Chọn: `Server → Data Import`
* Chọn file: `MenFashion_shop.sql`
* Import vào database: `mensfashion_shop`

---

## ⚙️ Cấu hình Backend

Mở file:

```
chatbox/src/main/resources/application.yml
```

Cấu hình:

```yml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mensfashion_shop?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true
    username: root
    password: root
```

---

## ▶️ Chạy Backend

### Bước 1

Mở project backend bằng **IntelliJ**

### Bước 2

Chạy file:

```
ChatboxApplication.java
```

### Bước 3

Kiểm tra:

```
http://localhost:8081
```

---

## 🌐 Chạy Frontend

### Bước 1

Mở thư mục:

```
frontend/Chatbox
```

### Bước 2

Chuột phải vào file:

```
DangNhap.html
```

→ Chọn **Open with Live Server**

### Bước 3

Truy cập:

```
http://127.0.0.1:5500
```

---

## 🔐 Tài khoản mẫu

### Admin

```
username: admin
password: 123456
```

### User

```
username: kh1
password: 123456
```

👉 Có thể tự đăng ký tài khoản mới.

---

## ⚠️ Lưu ý quan trọng

* ❗ Phải chạy backend trước
* ❗ Phải import database trước
* ❗ API backend: `http://localhost:8081`
* ❗ Frontend: `http://127.0.0.1:5500`
* ❗ CORS đã cấu hình
* ❗ Ảnh nằm tại:

  ```
  frontend/ChatBox/img
  ```

---

## 💬 Chatbot hoạt động như thế nào

* Chatbot sử dụng **kịch bản (scenario)** lưu trong database

* Cách hoạt động:

  * So khớp `keywords`
  * So khớp `question_pattern`

* Trả về các loại:

  * `TEXT`
  * `PRODUCT`
  * `SUGGESTION`

---

## 🧩 Cấu trúc Database (ERD)

Các bảng chính:

* users
* roles
* products
* categories
* chatbot_scenarios
* chat_conversations
* chat_messages
* chat_unresolved

### Quan hệ:

* User ↔ Role
* Product ↔ Category
* Chat ↔ User ↔ Product

---

## 🖼️ Giao diện hệ thống

### 🏠 Trang chủ

* Hiển thị sản phẩm
* Giới thiệu hệ thống

### 💬 Chatbox

* Chat realtime
* Gợi ý nhanh
* Lịch sử chat

### 🛠️ Admin

* Dashboard
* Quản lý kịch bản
* Quản lý user

---

## 📌 Hướng phát triển

* AI chatbot (thay rule-based)
* Thanh toán online
* Responsive mobile
* Notification realtime

---

## 👨‍💻 Tác giả

* Sinh viên phát triển hệ thống Chatbox thương mại điện tử
* Dùng cho mục đích học tập và demo

---

## ⭐ Ghi chú

Nếu gặp lỗi:

* Kiểm tra MySQL đã chạy chưa
* Kiểm tra port `8081`
* Kiểm tra API URL trong file JS

---

# Node.js Backend API - Hướng dẫn đầy đủ

Backend API scalable với authentication, MongoDB, và Swagger documentation.

## 📋 Mục lục
- [Cấu trúc project](#cấu-trúc-project)
- [Cài đặt](#cài-đặt)
- [Cấu hình MongoDB](#cấu-hình-mongodb)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [API Documentation](#api-documentation)
- [Testing với Postman](#testing-với-postman)
- [Mở rộng project](#mở-rộng-project)

## 🏗️ Cấu trúc Project

```
nodejs-backend-api/
├── src/
│   ├── config/
│   │   ├── database.js       # Kết nối MongoDB
│   │   └── swagger.js        # Cấu hình Swagger
│   ├── controllers/
│   │   ├── auth.controller.js    # Logic xác thực
│   │   └── user.controller.js    # Logic quản lý user
│   ├── middleware/
│   │   ├── auth.js           # Middleware xác thực JWT
│   │   └── errorHandler.js   # Xử lý lỗi tập trung
│   ├── models/
│   │   └── User.model.js     # Schema User
│   ├── routes/
│   │   ├── auth.routes.js    # Routes xác thực
│   │   └── user.routes.js    # Routes quản lý user
│   ├── utils/
│   │   ├── asyncHandler.js   # Wrapper xử lý async
│   │   └── errorResponse.js  # Class lỗi tùy chỉnh
│   └── server.js             # Entry point
├── .env                       # Biến môi trường
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Cài đặt

### 1. Clone hoặc tạo thư mục project

```bash
mkdir nodejs-backend-api
cd nodejs-backend-api
```

### 2. Copy các file code vào đúng cấu trúc thư mục như trên

### 3. Cài đặt dependencies

```bash
npm install
```

### 4. Tạo file .env và cấu hình

Copy nội dung từ file `.env` đã tạo và điều chỉnh các giá trị:

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/your_database_name

# JWT
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key_also_very_long
JWT_REFRESH_EXPIRE=30d
```

## 🗄️ Cấu hình MongoDB

### Option 1: MongoDB Local (Khuyến nghị cho development)

1. **Cài đặt MongoDB:**
   - Windows: Download từ https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb`

2. **Khởi động MongoDB:**
   ```bash
   # Windows (MongoDB Compass sẽ tự khởi động)
   # hoặc chạy:
   mongod
   
   # Mac/Linux
   brew services start mongodb-community
   # hoặc
   sudo systemctl start mongod
   ```

3. **Kiểm tra kết nối:**
   ```bash
   mongosh
   # Hoặc dùng MongoDB Compass GUI
   ```

4. **Cập nhật .env:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/my_project_db
   ```

### Option 2: MongoDB Atlas (Cloud - Khuyến nghị cho production)

1. **Tạo tài khoản MongoDB Atlas:** https://www.mongodb.com/cloud/atlas/register

2. **Tạo Cluster mới:**
   - Chọn FREE tier (M0)
   - Chọn region gần nhất (Singapore cho VN)

3. **Setup Database Access:**
   - Tạo user với username và password
   - Ghi nhớ credentials

4. **Setup Network Access:**
   - Thêm IP address (0.0.0.0/0 cho development)
   - Trong production, chỉ cho phép IP server

5. **Lấy Connection String:**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Thay `<password>` bằng password thật

6. **Cập nhật .env:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/my_database?retryWrites=true&w=majority
   ```

## ▶️ Chạy ứng dụng

### Development mode (với auto-restart)
```bash
npm run dev
```

### Production mode
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 📚 API Documentation

Truy cập Swagger UI: `http://localhost:5000/api-docs`

### Các endpoints chính:

#### Authentication
- `POST /api/v1/auth/register` - Đăng ký user mới
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Đăng xuất
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại

#### Users (Protected)
- `GET /api/v1/users` - Lấy danh sách users (Admin only)
- `GET /api/v1/users/:id` - Lấy thông tin user
- `PUT /api/v1/users/:id` - Cập nhật user
- `DELETE /api/v1/users/:id` - Xóa user (Admin only)

## 🧪 Testing với Postman

### 1. Đăng ký user mới
```http
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. Đăng nhập
```http
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response sẽ trả về `token` và `refreshToken`.

### 3. Sử dụng protected endpoints
```http
GET http://localhost:5000/api/v1/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

### 4. Refresh token khi hết hạn
```http
POST http://localhost:5000/api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}
```

## 🔧 Mở rộng Project

### Thêm Model mới

```javascript
// src/models/Product.model.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
```

### Thêm Routes mới

```javascript
// src/routes/product.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const productController = require('../controllers/product.controller');

router.route('/')
  .get(productController.getAllProducts)
  .post(protect, productController.createProduct);

router.route('/:id')
  .get(productController.getProduct)
  .put(protect, productController.updateProduct)
  .delete(protect, productController.deleteProduct);

module.exports = router;
```

### Thêm vào server.js

```javascript
app.use(`/api/${API_VERSION}/products`, require('./routes/product.routes'));
```

## 🔐 Best Practices

1. **Bảo mật:**
   - Luôn dùng HTTPS trong production
   - Thay đổi JWT_SECRET thành chuỗi ngẫu nhiên mạnh
   - Giới hạn rate limiting phù hợp
   - Validate input từ client

2. **Database:**
   - Tạo indexes cho các trường thường query
   - Sử dụng pagination cho danh sách lớn
   - Backup database định kỳ

3. **Code Organization:**
   - Tách logic phức tạp ra services
   - Viết tests cho các chức năng quan trọng
   - Document code và API đầy đủ

4. **Performance:**
   - Sử dụng caching (Redis) cho dữ liệu truy vấn nhiều
   - Optimize MongoDB queries
   - Compress responses

## 📝 Các tính năng có thể thêm

- [ ] Email verification
- [ ] Password reset
- [ ] File upload
- [ ] Role-based permissions (RBAC)
- [ ] Activity logging
- [ ] Two-factor authentication
- [ ] OAuth integration (Google, Facebook)
- [ ] Websocket support
- [ ] Caching với Redis
- [ ] Queue system với Bull
- [ ] Unit & Integration tests

## 🆘 Troubleshooting

### Lỗi kết nối MongoDB
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Giải pháp:** Đảm bảo MongoDB đang chạy hoặc kiểm tra connection string.

### Lỗi JWT
```
Error: jwt must be provided
```
**Giải pháp:** Kiểm tra header Authorization có đúng format `Bearer TOKEN`.

### Port đã được sử dụng
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Giải pháp:** Thay đổi PORT trong .env hoặc kill process đang dùng port 5000.

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy check:
1. Log trong terminal
2. MongoDB connection
3. Environment variables trong .env
4. Swagger docs để hiểu rõ API

---
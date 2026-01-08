require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Role = require('../models/Role.model');
const Permission = require('../models/Permission.model');

// Kết nối database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✔ MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const seedDefaultAdmin = async () => {
    try {
        console.log('🌱 Starting default admin seed...');

        // Lấy admin role
        const adminRole = await Role.findOne({ name: 'admin' });
        if (!adminRole) {
            console.error('❌ Admin role not found. Please run seed:roles first!');
            process.exit(1);
        }

        // Kiểm tra xem admin đã tồn tại chưa
        const adminExists = await User.findOne({ email: 'admin@example.com' });
        if (adminExists) {
            // Cập nhật role cho admin cũ
            adminExists.role = adminRole._id;
            await adminExists.save();
            console.log('✔ Updated existing admin role');
            console.log('   Email: admin@example.com');
            process.exit(0);
        }

        // Tạo tài khoản Admin mặc định
        await User.create({
            name: 'System Admin',
            email: 'admin@example.com',
            password: 'Admin@123',
            role: adminRole._id,
            isActive: true,
            shift: 'Administrative',
            workStatus: 'active'
        });

        console.log('✔ Created default admin account');
        console.log('\n📊 Summary:');
        console.log('   Email: admin@example.com');
        console.log('   Password: Admin@123');
        console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

// Chạy seeder
seedDefaultAdmin();

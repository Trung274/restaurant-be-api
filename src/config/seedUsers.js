require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Role = require('../models/Role.model');
const Permission = require('../models/Permission.model'); // Required for Role populate

// Kết nối database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✔ MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const seedUsers = async () => {
    try {
        console.log('🌱 Starting user seed process...');

        // Lấy các roles từ database
        const adminRole = await Role.findOne({ name: 'admin' });
        const managerRole = await Role.findOne({ name: 'manager' });
        const operationsRole = await Role.findOne({ name: 'operations' });
        const accountantRole = await Role.findOne({ name: 'accountant' });

        if (!adminRole || !managerRole || !operationsRole || !accountantRole) {
            console.error('❌ Roles not found. Please run seedRolesPermissions.js first!');
            process.exit(1);
        }

        // Xóa users cũ (trừ admin@example.com)
        await User.deleteMany({ email: { $ne: 'admin@example.com' } });
        console.log('✔ Cleared old user data (kept default admin)');

        // Tạo sample users
        const users = [
            {
                name: 'Trần Thị B',
                email: 'manager@restaurant.com',
                password: 'Manager@123',
                role: managerRole._id,
                phone: '0902345678',
                avatar: 'https://i.pravatar.cc/150?img=5',
                bio: 'Quản lý nhà hàng',
                isActive: true,
                shift: 'Morning',
                workStatus: 'active'
            },
            {
                name: 'Lê Hoàng C',
                email: 'chef@restaurant.com',
                password: 'Chef@123',
                role: operationsRole._id,
                phone: '0903456789',
                avatar: 'https://i.pravatar.cc/150?img=12',
                bio: 'Bếp trưởng',
                isActive: true,
                shift: 'Morning',
                workStatus: 'active'
            },
            {
                name: 'Phạm Minh D',
                email: 'waiter@restaurant.com',
                password: 'Waiter@123',
                role: operationsRole._id,
                phone: '0904567890',
                avatar: 'https://i.pravatar.cc/150?img=13',
                bio: 'Nhân viên phục vụ',
                isActive: true,
                shift: 'Evening',
                workStatus: 'on_leave'
            },
            {
                name: 'Hoàng Thu E',
                email: 'accountant@restaurant.com',
                password: 'Accountant@123',
                role: accountantRole._id,
                phone: '0905678901',
                avatar: 'https://i.pravatar.cc/150?img=9',
                bio: 'Kế toán viên',
                isActive: true,
                shift: 'Administrative',
                workStatus: 'active'
            },
            {
                name: 'Vũ Thị F',
                email: 'waiter2@restaurant.com',
                password: 'Waiter@123',
                role: operationsRole._id,
                phone: '0906789012',
                avatar: 'https://i.pravatar.cc/150?img=10',
                bio: 'Nhân viên phục vụ',
                isActive: false,
                shift: 'Evening',
                workStatus: 'inactive'
            }
        ];

        const createdUsers = [];
        for (const user of users) {
            const createdUser = await User.create(user);
            createdUsers.push(createdUser);
        }
        console.log(`✔ Created ${createdUsers.length} sample users`);

        // ==================== SUMMARY ====================
        console.log('\n🎉 User seed completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   Total users created: ${createdUsers.length}`);
        console.log(`\n👥 Sample accounts:`);
        users.forEach(user => {
            console.log(`   - ${user.email} / ${user.password.split('@')[0]}@123`);
        });
        console.log(`\n⚠️  CHANGE THESE PASSWORDS IN PRODUCTION!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

// Chạy seeder
seedUsers();

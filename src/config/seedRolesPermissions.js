require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role.model');
const Permission = require('../models/Permission.model');
const User = require('../models/User.model');
const Restaurant = require('../models/Restaurant.model');

// Kết nối database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✔ MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedData = async () => {
  try {
    console.log('🌱 Starting seed process...');

    // Xóa dữ liệu cũ
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    console.log('✔ Cleared old data');

    // ==================== PERMISSIONS ====================
    const permissions = await Permission.insertMany([
      // User Management
      { resource: 'users', action: 'create', description: 'Create new users' },
      { resource: 'users', action: 'read', description: 'View user details' },
      { resource: 'users', action: 'update', description: 'Update user information' },
      { resource: 'users', action: 'delete', description: 'Delete users' },
      { resource: 'users', action: 'list', description: 'List all users' },

      // Role Management
      { resource: 'roles', action: 'create', description: 'Create new roles' },
      { resource: 'roles', action: 'read', description: 'View role details' },
      { resource: 'roles', action: 'update', description: 'Update roles' },
      { resource: 'roles', action: 'delete', description: 'Delete roles' },
      { resource: 'roles', action: 'list', description: 'List all roles' },

      // Permission Management
      { resource: 'permissions', action: 'create', description: 'Create permissions' },
      { resource: 'permissions', action: 'read', description: 'View permissions' },
      { resource: 'permissions', action: 'update', description: 'Update permissions' },
      { resource: 'permissions', action: 'delete', description: 'Delete permissions' },
      { resource: 'permissions', action: 'list', description: 'List all permissions' },

      // Restaurant Management
      { resource: 'restaurant', action: 'read', description: 'View restaurant information' },
      { resource: 'restaurant', action: 'update', description: 'Update restaurant information' },

      // Profile Management (cho user thường)
      { resource: 'profile', action: 'read', description: 'View own profile' },
      { resource: 'profile', action: 'update', description: 'Update own profile' },
    ]);
    console.log('✔ Created permissions');

    // ==================== ROLES ====================
    // Admin Role (full permissions)
    const adminPermissions = permissions.map(p => p._id);
    const adminRole = await Role.create({
      name: 'admin',
      description: 'Administrator with full access',
      permissions: adminPermissions
    });
    console.log('✔ Created admin role');

    // User Role (limited permissions)
    const userPermissions = permissions
      .filter(p =>
        p.resource === 'profile' ||
        (p.resource === 'restaurant' && p.action === 'read')
      )
      .map(p => p._id);

    const userRole = await Role.create({
      name: 'user',
      description: 'Regular user with limited access',
      permissions: userPermissions
    });
    console.log('✔ Created user role');

    // Operations Role (same permissions as user)
    const operationsRole = await Role.create({
      name: 'operations',
      description: 'Operations staff with user-level access',
      permissions: userPermissions
    });
    console.log('✔ Created operations role');

    // Manager Role (same permissions as user)
    const managerRole = await Role.create({
      name: 'manager',
      description: 'Manager with user-level access',
      permissions: userPermissions
    });
    console.log('✔ Created manager role');

    // Accountant Role (same permissions as user)
    const accountantRole = await Role.create({
      name: 'accountant',
      description: 'Accountant with user-level access',
      permissions: userPermissions
    });
    console.log('✔ Created accountant role');

    // ==================== DEFAULT DATA ====================
    // Tạo tài khoản Admin mặc định
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@example.com',
        password: 'Admin@123',
        role: adminRole._id,
        isActive: true
      });
      console.log('✔ Created default admin account');
      console.log('  Email: admin@example.com');
      console.log('  Password: Admin@123');
      console.log('  ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
    }

    // Tạo Restaurant mặc định
    await Restaurant.create({
      name: 'Nhà hàng Chim lớn',
      phone: '0934567890',
      email: 'restaurant@example.com',
      address: '18 Hoàng Quốc Việt, Nghĩa Đô, Cầu Giấy, Hà Nội',
      openTime: '08:00',
      closeTime: '22:00',
      description: 'Nhà hàng chuyên phục vụ các món ăn ngon'
    });
    console.log('✔ Created default restaurant');

    // ==================== SUMMARY ====================
    console.log('\n🎉 Seed completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Permissions: ${permissions.length}`);
    console.log(`   Roles: 5 (admin, user, operations, manager, accountant)`);
    console.log(`   Users: ${adminExists ? 'Admin already exists' : '1 admin created'}`);
    console.log(`   Restaurant: 1 default restaurant created`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

// Chạy seeder
seedData();
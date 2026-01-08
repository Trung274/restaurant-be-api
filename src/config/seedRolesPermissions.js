require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role.model');
const Permission = require('../models/Permission.model');

// Kết nối database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✔ MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedRolesPermissions = async () => {
  try {
    console.log('🌱 Starting roles & permissions seed...');

    // Xóa dữ liệu cũ
    await Permission.deleteMany({});
    await Role.deleteMany({});
    console.log('✔ Cleared old permissions and roles');

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

      // Menu Items Management
      { resource: 'menu-items', action: 'create', description: 'Create menu items' },
      { resource: 'menu-items', action: 'read', description: 'View menu items' },
      { resource: 'menu-items', action: 'update', description: 'Update menu items' },
      { resource: 'menu-items', action: 'delete', description: 'Delete menu items' },
      { resource: 'menu-items', action: 'list', description: 'List all menu items' },

      // Table Management
      { resource: 'tables', action: 'create', description: 'Create new tables' },
      { resource: 'tables', action: 'read', description: 'View table details' },
      { resource: 'tables', action: 'update', description: 'Update table configuration' },
      { resource: 'tables', action: 'delete', description: 'Delete tables' },
      { resource: 'tables', action: 'list', description: 'List all tables' },
      { resource: 'tables', action: 'check-in', description: 'Check-in table' },
      { resource: 'tables', action: 'reserve', description: 'Reserve table' },
      { resource: 'tables', action: 'checkout', description: 'Checkout table' },
      { resource: 'tables', action: 'clean', description: 'Clean table' },

      // Orders Management
      { resource: 'orders', action: 'create', description: 'Create orders' },
      { resource: 'orders', action: 'read', description: 'View orders' },
      { resource: 'orders', action: 'update', description: 'Update orders' },
      { resource: 'orders', action: 'serve', description: 'Mark items as served' },
      { resource: 'orders', action: 'cancel', description: 'Cancel orders' },

      // Kitchen Operations
      { resource: 'kitchen', action: 'read', description: 'View kitchen queue' },
      { resource: 'kitchen', action: 'start', description: 'Start preparing items' },
      { resource: 'kitchen', action: 'ready', description: 'Mark items as ready' },
      { resource: 'kitchen', action: 'priority', description: 'Update item priority' },
      { resource: 'kitchen', action: 'stats', description: 'View kitchen stats' },
    ]);
    console.log('✔ Created permissions');

    // ==================== ROLES ====================
    // Admin Role (full permissions)
    const adminPermissions = permissions.map(p => p._id);
    await Role.create({
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

    await Role.create({
      name: 'user',
      description: 'Regular user with limited access',
      permissions: userPermissions
    });
    console.log('✔ Created user role');

    // Operations Role (table operations + orders + kitchen read)
    const operationsPermissions = permissions
      .filter(p =>
        p.resource === 'profile' ||
        (p.resource === 'restaurant' && p.action === 'read') ||
        (p.resource === 'tables' && ['read', 'list', 'check-in', 'reserve', 'checkout', 'clean'].includes(p.action)) ||
        (p.resource === 'menu-items' && ['read', 'list'].includes(p.action)) ||
        (p.resource === 'orders' && ['create', 'read', 'serve'].includes(p.action)) ||
        (p.resource === 'kitchen' && p.action === 'read')
      )
      .map(p => p._id);

    await Role.create({
      name: 'operations',
      description: 'Operations staff with table, order, and kitchen queue access',
      permissions: operationsPermissions
    });
    console.log('✔ Created operations role');

    // Manager Role (full menu, table, orders, and kitchen management)
    const managerPermissions = permissions
      .filter(p =>
        p.resource === 'profile' ||
        p.resource === 'menu-items' ||
        p.resource === 'tables' ||
        p.resource === 'orders' ||
        p.resource === 'kitchen' ||
        (p.resource === 'restaurant' && p.action === 'read')
      )
      .map(p => p._id);

    await Role.create({
      name: 'manager',
      description: 'Manager with full menu, table, order, and kitchen access',
      permissions: managerPermissions
    });
    console.log('✔ Created manager role');

    // Accountant Role (same permissions as user)
    await Role.create({
      name: 'accountant',
      description: 'Accountant with user-level access',
      permissions: userPermissions
    });
    console.log('✔ Created accountant role');

    // ==================== SUMMARY ====================
    console.log('\n🎉 Roles & Permissions seed completed!');
    console.log(`\n📊 Summary:`);
    console.log(`   Permissions: ${permissions.length}`);
    console.log(`   Roles: 5 (admin, user, operations, manager, accountant)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

// Chạy seeder
seedRolesPermissions();
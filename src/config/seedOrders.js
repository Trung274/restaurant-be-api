require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const MenuItem = require('../models/MenuItem.model');
const Table = require('../models/Table.model');
const User = require('../models/User.model');
const Role = require('../models/Role.model'); // Need this for User populate

// Kết nối database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✔ MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const seedOrders = async () => {
    try {
        console.log('🌱 Starting order seed process...');

        // Xóa dữ liệu cũ
        await Order.deleteMany({});
        console.log('✔ Cleared old orders');

        // Lấy dữ liệu cần thiết
        const menuItems = await MenuItem.find({ status: 'available' }).lean();
        const tables = await Table.find({}).lean();
        const users = await User.find({}).lean();

        if (menuItems.length === 0) {
            console.log('⚠️  No menu items found. Please run seedMenuItems.js first.');
            process.exit(1);
        }

        if (tables.length === 0) {
            console.log('⚠️  No tables found. Please run seedTables.js first.');
            process.exit(1);
        }

        console.log(`✔ Found ${menuItems.length} menu items`);
        console.log(`✔ Found ${tables.length} tables`);

        // Tìm món ăn theo category để dễ tạo order
        const getItemsByCategory = (category) => menuItems.filter(m => m.category === category);
        const mainDishes = getItemsByCategory('Món chính');
        const appetizers = getItemsByCategory('Khai vị');
        const drinks = getItemsByCategory('Đồ uống');
        const desserts = getItemsByCategory('Tráng miệng');
        const specials = getItemsByCategory('Món đặc biệt');

        // Helper function để tạo order item
        const createOrderItem = (menuItem, quantity = 1, options = {}) => ({
            menuItemId: menuItem._id,
            name: menuItem.name,
            quantity,
            price: menuItem.price,
            subtotal: menuItem.price * quantity,
            notes: options.notes || '',
            estimatedTime: options.estimatedTime || 15,
            priority: options.priority || 'normal',
            kitchenStatus: options.kitchenStatus || 'queued',
            queuedAt: options.queuedAt || new Date(),
            startedAt: options.startedAt,
            readyAt: options.readyAt,
            servedAt: options.servedAt
        });

        // Tạo các orders với trạng thái khác nhau
        const ordersData = [];

        // ==================== ORDER 1: Pending (mới tạo) ====================
        if (tables[0] && mainDishes[0] && drinks[0]) {
            ordersData.push({
                tableId: tables[0]._id,
                tableNumber: tables[0].number,
                numberOfGuests: 2,
                items: [
                    createOrderItem(mainDishes[0], 2), // Phở bò
                    createOrderItem(drinks[0], 2)      // Cà phê
                ],
                status: 'pending',
                notes: 'Khách yêu cầu phục vụ nhanh',
                createdBy: users[0]?._id,
                checkInTime: new Date(Date.now() - 5 * 60000) // 5 phút trước
            });
        }

        // ==================== ORDER 2: In-Progress (đang nấu) ====================
        if (tables[1] && mainDishes[1] && appetizers[0] && drinks[1]) {
            const now = new Date();
            const startTime = new Date(now.getTime() - 10 * 60000); // 10 phút trước

            ordersData.push({
                tableId: tables[1]._id,
                tableNumber: tables[1].number,
                numberOfGuests: 4,
                items: [
                    createOrderItem(appetizers[0], 1, {
                        kitchenStatus: 'ready',
                        queuedAt: new Date(now.getTime() - 15 * 60000),
                        startedAt: new Date(now.getTime() - 12 * 60000),
                        readyAt: new Date(now.getTime() - 5 * 60000)
                    }),
                    createOrderItem(mainDishes[1], 4, {
                        kitchenStatus: 'preparing',
                        queuedAt: new Date(now.getTime() - 15 * 60000),
                        startedAt: startTime,
                        estimatedTime: 20
                    }),
                    createOrderItem(drinks[1], 4, {
                        kitchenStatus: 'ready',
                        queuedAt: new Date(now.getTime() - 15 * 60000),
                        startedAt: new Date(now.getTime() - 10 * 60000),
                        readyAt: new Date(now.getTime() - 8 * 60000)
                    })
                ],
                status: 'in-progress',
                notes: 'Bàn VIP, chú ý phục vụ',
                createdBy: users[0]?._id,
                checkInTime: new Date(now.getTime() - 20 * 60000)
            });
        }

        // ==================== ORDER 3: Ready (sẵn sàng phục vụ) ====================
        if (tables[2] && mainDishes[2] && appetizers[1] && drinks[0]) {
            const now = new Date();

            ordersData.push({
                tableId: tables[2]._id,
                tableNumber: tables[2].number,
                numberOfGuests: 3,
                items: [
                    createOrderItem(appetizers[1], 1, {
                        kitchenStatus: 'ready',
                        queuedAt: new Date(now.getTime() - 25 * 60000),
                        startedAt: new Date(now.getTime() - 20 * 60000),
                        readyAt: new Date(now.getTime() - 15 * 60000)
                    }),
                    createOrderItem(mainDishes[2], 3, {
                        kitchenStatus: 'ready',
                        queuedAt: new Date(now.getTime() - 25 * 60000),
                        startedAt: new Date(now.getTime() - 20 * 60000),
                        readyAt: new Date(now.getTime() - 10 * 60000)
                    }),
                    createOrderItem(drinks[0], 3, {
                        kitchenStatus: 'ready',
                        queuedAt: new Date(now.getTime() - 25 * 60000),
                        startedAt: new Date(now.getTime() - 22 * 60000),
                        readyAt: new Date(now.getTime() - 20 * 60000)
                    })
                ],
                status: 'ready',
                createdBy: users[0]?._id,
                checkInTime: new Date(now.getTime() - 30 * 60000)
            });
        }

        // ==================== ORDER 4: Completed (đã hoàn thành) ====================
        if (tables[3] && mainDishes[3] && desserts[0] && drinks[0]) {
            const now = new Date();
            const checkoutTime = new Date(now.getTime() - 10 * 60000);

            ordersData.push({
                tableId: tables[3]._id,
                tableNumber: tables[3].number,
                numberOfGuests: 2,
                items: [
                    createOrderItem(mainDishes[3], 2, {
                        kitchenStatus: 'served',
                        queuedAt: new Date(now.getTime() - 60 * 60000),
                        startedAt: new Date(now.getTime() - 55 * 60000),
                        readyAt: new Date(now.getTime() - 40 * 60000),
                        servedAt: new Date(now.getTime() - 35 * 60000)
                    }),
                    createOrderItem(desserts[0], 2, {
                        kitchenStatus: 'served',
                        queuedAt: new Date(now.getTime() - 30 * 60000),
                        startedAt: new Date(now.getTime() - 25 * 60000),
                        readyAt: new Date(now.getTime() - 20 * 60000),
                        servedAt: new Date(now.getTime() - 15 * 60000)
                    }),
                    createOrderItem(drinks[0], 2, {
                        kitchenStatus: 'served',
                        queuedAt: new Date(now.getTime() - 60 * 60000),
                        startedAt: new Date(now.getTime() - 58 * 60000),
                        readyAt: new Date(now.getTime() - 55 * 60000),
                        servedAt: new Date(now.getTime() - 50 * 60000)
                    })
                ],
                status: 'completed',
                checkInTime: new Date(now.getTime() - 70 * 60000),
                checkOutTime: checkoutTime,
                paymentStatus: 'paid',
                paymentMethod: 'card',
                createdBy: users[0]?._id,
                servedBy: users[0]?._id
            });
        }

        // ==================== ORDER 5: Special order (lẩu, urgent priority) ====================
        if (tables[4] && specials[0] && appetizers[0] && drinks[1]) {
            const now = new Date();

            ordersData.push({
                tableId: tables[4]._id,
                tableNumber: tables[4].number,
                numberOfGuests: 4,
                items: [
                    createOrderItem(appetizers[0], 2, {
                        kitchenStatus: 'preparing',
                        priority: 'high',
                        queuedAt: new Date(now.getTime() - 8 * 60000),
                        startedAt: new Date(now.getTime() - 5 * 60000)
                    }),
                    createOrderItem(specials[0], 1, { // Lẩu Thái
                        kitchenStatus: 'preparing',
                        priority: 'urgent',
                        estimatedTime: 30,
                        queuedAt: new Date(now.getTime() - 8 * 60000),
                        startedAt: new Date(now.getTime() - 5 * 60000),
                        notes: 'Khách yêu cầu cay vừa'
                    }),
                    createOrderItem(drinks[1], 4, {
                        kitchenStatus: 'ready',
                        queuedAt: new Date(now.getTime() - 8 * 60000),
                        startedAt: new Date(now.getTime() - 7 * 60000),
                        readyAt: new Date(now.getTime() - 5 * 60000)
                    })
                ],
                status: 'in-progress',
                notes: 'Khách VIP - ưu tiên cao',
                createdBy: users[0]?._id,
                checkInTime: new Date(now.getTime() - 10 * 60000)
            });
        }

        // ==================== ORDER 6: Mixed status items ====================
        if (tables[5] && mainDishes[4] && appetizers[2] && drinks[0] && desserts[0]) {
            const now = new Date();

            ordersData.push({
                tableId: tables[5]._id,
                tableNumber: tables[5].number,
                numberOfGuests: 5,
                items: [
                    createOrderItem(appetizers[2], 2, {
                        kitchenStatus: 'served',
                        queuedAt: new Date(now.getTime() - 30 * 60000),
                        startedAt: new Date(now.getTime() - 28 * 60000),
                        readyAt: new Date(now.getTime() - 25 * 60000),
                        servedAt: new Date(now.getTime() - 20 * 60000)
                    }),
                    createOrderItem(mainDishes[4], 5, {
                        kitchenStatus: 'preparing',
                        queuedAt: new Date(now.getTime() - 20 * 60000),
                        startedAt: new Date(now.getTime() - 15 * 60000),
                        estimatedTime: 25
                    }),
                    createOrderItem(drinks[0], 5, {
                        kitchenStatus: 'served',
                        queuedAt: new Date(now.getTime() - 30 * 60000),
                        startedAt: new Date(now.getTime() - 28 * 60000),
                        readyAt: new Date(now.getTime() - 26 * 60000),
                        servedAt: new Date(now.getTime() - 25 * 60000)
                    })
                ],
                status: 'in-progress',
                createdBy: users[0]?._id,
                checkInTime: new Date(now.getTime() - 35 * 60000)
            });
        }

        // Tạo orders
        const orders = await Order.insertMany(ordersData);
        console.log('✔ Created sample orders');

        // ==================== SUMMARY ====================
        console.log('\n🎉 Order seed completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   Total Orders: ${orders.length}`);
        console.log(`   - Pending: ${orders.filter(o => o.status === 'pending').length}`);
        console.log(`   - In-Progress: ${orders.filter(o => o.status === 'in-progress').length}`);
        console.log(`   - Ready: ${orders.filter(o => o.status === 'ready').length}`);
        console.log(`   - Completed: ${orders.filter(o => o.status === 'completed').length}`);
        console.log(`\n   Total Items: ${orders.reduce((sum, o) => sum + o.items.length, 0)}`);

        // Count items by kitchen status
        let itemsByStatus = { queued: 0, preparing: 0, ready: 0, served: 0 };
        orders.forEach(order => {
            order.items.forEach(item => {
                itemsByStatus[item.kitchenStatus]++;
            });
        });
        console.log(`\n   Items by Kitchen Status:`);
        console.log(`   - Queued: ${itemsByStatus.queued}`);
        console.log(`   - Preparing: ${itemsByStatus.preparing}`);
        console.log(`   - Ready: ${itemsByStatus.ready}`);
        console.log(`   - Served: ${itemsByStatus.served}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

// Chạy seeder
seedOrders();

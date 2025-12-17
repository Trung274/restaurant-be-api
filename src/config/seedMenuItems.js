require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem.model');

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
        await MenuItem.deleteMany({});
        console.log('✔ Cleared old menu items');

        // ==================== MENU ITEMS ====================
        const menuItemsData = [
            {
                name: 'Phở bò đặc biệt',
                category: 'Món chính',
                price: 85000,
                image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop',
                description: 'Phở bò truyền thống với nước dùng hầm xương 12 tiếng',
                rating: 4.8,
                reviews: 124,
                status: 'available',
                popular: true,
                spicy: false,
                vegetarian: false
            },
            {
                name: 'Bún chả Hà Nội',
                category: 'Món chính',
                price: 75000,
                image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop',
                description: 'Bún chả nướng than hoa, chả thơm ngon đậm đà',
                rating: 4.9,
                reviews: 98,
                status: 'available',
                popular: true,
                spicy: false,
                vegetarian: false
            },
            {
                name: 'Gỏi cuốn tôm thịt',
                category: 'Khai vị',
                price: 45000,
                image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop',
                description: 'Gỏi cuốn tươi ngon với tôm, thịt và rau thơm',
                rating: 4.6,
                reviews: 76,
                status: 'available',
                popular: false,
                spicy: false,
                vegetarian: false
            },
            {
                name: 'Cơm chiên dương châu',
                category: 'Món chính',
                price: 65000,
                image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
                description: 'Cơm chiên thập cẩm với tôm, thịt, trứng',
                rating: 4.5,
                reviews: 89,
                status: 'available',
                popular: false,
                spicy: false,
                vegetarian: false
            },
            {
                name: 'Lẩu Thái hải sản',
                category: 'Món đặc biệt',
                price: 350000,
                image: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?w=400&h=300&fit=crop',
                description: 'Lẩu Thái chua cay với hải sản tươi sống (2-4 người)',
                rating: 4.9,
                reviews: 156,
                status: 'available',
                popular: true,
                spicy: true,
                vegetarian: false
            },
            {
                name: 'Nem rán giòn',
                category: 'Khai vị',
                price: 55000,
                image: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&h=300&fit=crop',
                description: 'Nem cuốn rán giòn tan, chấm tương đặc biệt',
                rating: 4.7,
                reviews: 67,
                status: 'available',
                popular: false,
                spicy: false,
                vegetarian: false
            },
            {
                name: 'Cà phê sữa đá',
                category: 'Đồ uống',
                price: 25000,
                image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
                description: 'Cà phê phin truyền thống pha sữa đá',
                rating: 4.8,
                reviews: 201,
                status: 'available',
                popular: true,
                spicy: false,
                vegetarian: true
            },
            {
                name: 'Trà sữa trân châu',
                category: 'Đồ uống',
                price: 35000,
                image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&h=300&fit=crop',
                description: 'Trà sữa ngon với topping trân châu đen',
                rating: 4.4,
                reviews: 143,
                status: 'available',
                popular: false,
                spicy: false,
                vegetarian: true
            },
            {
                name: 'Bánh flan caramel',
                category: 'Tráng miệng',
                price: 30000,
                image: 'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=400&h=300&fit=crop',
                description: 'Bánh flan mềm mịn với caramel đắng nhẹ',
                rating: 4.6,
                reviews: 88,
                status: 'available',
                popular: false,
                spicy: false,
                vegetarian: true
            },
            {
                name: 'Mì xào hải sản',
                category: 'Món chính',
                price: 95000,
                image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop',
                description: 'Mì xào giòn với hải sản tươi ngon',
                rating: 4.7,
                reviews: 112,
                status: 'out_of_stock',
                popular: false,
                spicy: true,
                vegetarian: false
            },
            {
                name: 'Salad Caesar',
                category: 'Khai vị',
                price: 65000,
                image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
                description: 'Salad rau xanh với sốt Caesar và bánh mì nướng',
                rating: 4.5,
                reviews: 54,
                status: 'available',
                popular: false,
                spicy: false,
                vegetarian: true
            },
            {
                name: 'Cơm tấm sườn bì',
                category: 'Món chính',
                price: 70000,
                image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
                description: 'Cơm tấm truyền thống Sài Gòn với sườn nướng',
                rating: 4.8,
                reviews: 167,
                status: 'available',
                popular: true,
                spicy: false,
                vegetarian: false
            }
        ];

        const menuItems = await MenuItem.insertMany(menuItemsData);
        console.log('✔ Created menu items');

        // ==================== SUMMARY ====================
        console.log('\n🎉 Seed completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   Menu Items: ${menuItems.length}`);
        console.log(`   - Món chính: ${menuItems.filter(m => m.category === 'Món chính').length}`);
        console.log(`   - Khai vị: ${menuItems.filter(m => m.category === 'Khai vị').length}`);
        console.log(`   - Món đặc biệt: ${menuItems.filter(m => m.category === 'Món đặc biệt').length}`);
        console.log(`   - Đồ uống: ${menuItems.filter(m => m.category === 'Đồ uống').length}`);
        console.log(`   - Tráng miệng: ${menuItems.filter(m => m.category === 'Tráng miệng').length}`);
        console.log(`   - Popular items: ${menuItems.filter(m => m.popular).length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

// Chạy seeder
seedData();

require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant.model');

// Kết nối database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✔ MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const seedRestaurant = async () => {
    try {
        console.log('🌱 Starting restaurant seed...');

        // Xóa dữ liệu cũ
        await Restaurant.deleteMany({});
        console.log('✔ Cleared old restaurant data');

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
        console.log('\n🎉 Restaurant seed completed!');
        console.log('\n📊 Summary:');
        console.log('   Restaurant: Nhà hàng Chim lớn');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

// Chạy seeder
seedRestaurant();

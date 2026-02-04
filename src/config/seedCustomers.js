require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../models/Customer.model');

// Connect to database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✔ MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const sampleCustomers = [
    {
        name: 'Nguyễn Thị Mai',
        phone: '0901234567',
        email: 'nguyenthimai@gmail.com',
        avatar: 'https://i.pravatar.cc/150?img=1',
        membershipTier: 'vip',
        points: 2450,
        totalOrders: 67,
        totalSpent: 18500000,
        isFavorite: true,
        notes: 'Khách VIP, thích món Phở Bò'
    },
    {
        name: 'Trần Văn Bình',
        phone: '0902345678',
        email: 'tranvanbinh@gmail.com',
        avatar: 'https://i.pravatar.cc/150?img=12',
        membershipTier: 'gold',
        points: 1850,
        totalOrders: 45,
        totalSpent: 12300000,
        notes: 'Thường đặt bàn vào cuối tuần'
    },
    {
        name: 'Lê Minh Hà',
        phone: '0903456789',
        email: 'leminhha@gmail.com',
        avatar: 'https://i.pravatar.cc/150?img=5',
        membershipTier: 'silver',
        points: 850,
        totalOrders: 28,
        totalSpent: 7200000,
        isFavorite: true
    },
    {
        name: 'Phạm Thu Hương',
        phone: '0904567890',
        email: 'phamthuhuong@gmail.com',
        avatar: 'https://i.pravatar.cc/150?img=9',
        membershipTier: 'vip',
        points: 3200,
        totalOrders: 89,
        totalSpent: 24700000,
        isFavorite: true,
        notes: 'Khách quen, hay giới thiệu bạn bè'
    },
    {
        name: 'Hoàng Văn Tuấn',
        phone: '0905678901',
        email: 'hoangvantuan@gmail.com',
        avatar: 'https://i.pravatar.cc/150?img=13',
        membershipTier: 'bronze',
        points: 320,
        totalOrders: 12,
        totalSpent: 3100000
    },
    {
        name: 'Đặng Thị Lan',
        phone: '0906789012',
        email: 'dangthilan@gmail.com',
        avatar: 'https://i.pravatar.cc/150?img=47',
        membershipTier: 'silver',
        points: 680,
        totalOrders: 22,
        totalSpent: 5800000
    },
    {
        name: 'Vũ Minh Quân',
        phone: '0907890123',
        email: 'vuminhquan@gmail.com',
        avatar: 'https://i.pravatar.cc/150?img=33',
        membershipTier: 'gold',
        points: 1520,
        totalOrders: 38,
        totalSpent: 10200000,
        notes: 'Thích món hải sản'
    },
    {
        name: 'Bùi Thị Hoa',
        phone: '0908901234',
        email: 'buithihoa@gmail.com',
        avatar: 'https://i.pravatar.cc/150?img=20',
        membershipTier: 'bronze',
        points: 180,
        totalOrders: 8,
        totalSpent: 2100000
    },
    {
        name: 'Ngô Văn Đức',
        phone: '0909012345',
        email: 'ngovanduc@gmail.com',
        avatar: 'https://i.pravatar.cc/150?img=68',
        membershipTier: 'silver',
        points: 920,
        totalOrders: 31,
        totalSpent: 8400000,
        isFavorite: true
    },
    {
        name: 'Lý Thị Ngọc',
        phone: '0910123456',
        email: 'lythingoc@gmail.com',
        avatar: 'https://i.pravatar.cc/150?img=45',
        membershipTier: 'gold',
        points: 1680,
        totalOrders: 42,
        totalSpent: 11500000
    }
];

const seedCustomers = async () => {
    try {
        console.log('🌱 Starting customer seed process...');

        // Clear existing customers
        await Customer.deleteMany({});
        console.log('✔ Cleared old customer data');

        // Create customers
        const customers = await Customer.insertMany(sampleCustomers);
        console.log(`✔ Created ${customers.length} sample customers`);

        console.log('\n🎉 Customer seed completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   Total customers: ${customers.length}`);
        console.log(`   VIP: ${customers.filter(c => c.membershipTier === 'vip').length}`);
        console.log(`   Gold: ${customers.filter(c => c.membershipTier === 'gold').length}`);
        console.log(`   Silver: ${customers.filter(c => c.membershipTier === 'silver').length}`);
        console.log(`   Bronze: ${customers.filter(c => c.membershipTier === 'bronze').length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding customers:', error);
        process.exit(1);
    }
};

seedCustomers();

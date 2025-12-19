require('dotenv').config();
const mongoose = require('mongoose');
const Table = require('../models/Table.model');

// Kết nối database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✔ MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        console.log('🌱 Starting table seed process...');

        // Xóa dữ liệu cũ
        await Table.deleteMany({});
        console.log('✔ Cleared old tables');

        // ==================== TABLES ====================
        const tablesData = [
            // Floor 1 - Main Area (10 tables)
            {
                number: '01',
                capacity: 4,
                floor: 'Tầng 1',
                section: 'Main',
                status: 'available'
            },
            {
                number: '02',
                capacity: 2,
                floor: 'Tầng 1',
                section: 'Main',
                status: 'available'
            },
            {
                number: '03',
                capacity: 6,
                floor: 'Tầng 1',
                section: 'Main',
                status: 'available'
            },
            {
                number: '04',
                capacity: 4,
                floor: 'Tầng 1',
                section: 'Main',
                status: 'available'
            },
            {
                number: '05',
                capacity: 4,
                floor: 'Tầng 1',
                section: 'Main',
                status: 'available'
            },
            {
                number: '06',
                capacity: 2,
                floor: 'Tầng 1',
                section: 'Main',
                status: 'available'
            },
            {
                number: '07',
                capacity: 6,
                floor: 'Tầng 1',
                section: 'Main',
                status: 'available'
            },
            {
                number: '08',
                capacity: 4,
                floor: 'Tầng 1',
                section: 'Main',
                status: 'available'
            },
            {
                number: '09',
                capacity: 4,
                floor: 'Tầng 1',
                section: 'Main',
                status: 'available'
            },
            {
                number: '10',
                capacity: 2,
                floor: 'Tầng 1',
                section: 'Main',
                status: 'available'
            },

            // Floor 2 - VIP Area (5 tables)
            {
                number: 'V1',
                capacity: 8,
                floor: 'Tầng 2',
                section: 'VIP',
                status: 'available'
            },
            {
                number: 'V2',
                capacity: 6,
                floor: 'Tầng 2',
                section: 'VIP',
                status: 'available'
            },
            {
                number: 'V3',
                capacity: 4,
                floor: 'Tầng 2',
                section: 'VIP',
                status: 'available'
            },
            {
                number: 'V4',
                capacity: 6,
                floor: 'Tầng 2',
                section: 'VIP',
                status: 'available'
            },
            {
                number: 'V5',
                capacity: 10,
                floor: 'Tầng 2',
                section: 'VIP',
                status: 'available'
            },

            // Outdoor Area (6 tables)
            {
                number: 'O1',
                capacity: 2,
                floor: 'Sân thượng',
                section: 'Outdoor',
                status: 'available'
            },
            {
                number: 'O2',
                capacity: 4,
                floor: 'Sân thượng',
                section: 'Outdoor',
                status: 'available'
            },
            {
                number: 'O3',
                capacity: 2,
                floor: 'Sân thượng',
                section: 'Outdoor',
                status: 'available'
            },
            {
                number: 'O4',
                capacity: 4,
                floor: 'Sân thượng',
                section: 'Outdoor',
                status: 'available'
            },
            {
                number: 'O5',
                capacity: 4,
                floor: 'Sân thượng',
                section: 'Outdoor',
                status: 'available'
            },
            {
                number: 'O6',
                capacity: 2,
                floor: 'Sân thượng',
                section: 'Outdoor',
                status: 'available'
            }
        ];

        const tables = await Table.insertMany(tablesData);
        console.log('✔ Created tables');

        // ==================== SUMMARY ====================
        console.log('\n🎉 Seed completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   Total Tables: ${tables.length}`);
        console.log(`   - Tầng 1: ${tables.filter(t => t.floor === 'Tầng 1').length}`);
        console.log(`   - Tầng 2: ${tables.filter(t => t.floor === 'Tầng 2').length}`);
        console.log(`   - Sân thượng: ${tables.filter(t => t.floor === 'Sân thượng').length}`);
        console.log(`\n   By Section:`);
        console.log(`   - Main: ${tables.filter(t => t.section === 'Main').length}`);
        console.log(`   - VIP: ${tables.filter(t => t.section === 'VIP').length}`);
        console.log(`   - Outdoor: ${tables.filter(t => t.section === 'Outdoor').length}`);
        console.log(`\n   All tables are available (chưa đặt)`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

// Chạy seeder
seedData();

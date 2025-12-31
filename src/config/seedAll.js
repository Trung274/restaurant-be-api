require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const runSeed = async (scriptName, description) => {
    console.log(`\n🔄 Running ${description}...`);
    try {
        const { stdout, stderr } = await execPromise(`node src/config/${scriptName}`);
        console.log(stdout);
        if (stderr) console.error(stderr);
        return true;
    } catch (error) {
        console.error(`❌ Error running ${description}:`, error.message);
        return false;
    }
};

const seedAll = async () => {
    console.log('🌱 Starting complete database seed...\n');
    console.log('='.repeat(50));

    const seeds = [
        { script: 'seedRolesPermissions.js', desc: 'Roles & Permissions' },
        { script: 'seedDefaultAdmin.js', desc: 'Default Admin User' },
        { script: 'seedRestaurant.js', desc: 'Restaurant Data' },
        { script: 'seedTables.js', desc: 'Table Data' },
        { script: 'seedMenuItems.js', desc: 'Menu Items' },
        { script: 'seedUsers.js', desc: 'Sample Users' }
    ];

    let successCount = 0;
    let failCount = 0;

    for (const seed of seeds) {
        const success = await runSeed(seed.script, seed.desc);
        if (success) {
            successCount++;
        } else {
            failCount++;
            console.log(`⚠️  Continuing despite error in ${seed.desc}...`);
        }
        console.log('='.repeat(50));
    }

    console.log('\n🎉 Seed process completed!');
    console.log(`\n📊 Final Summary:`);
    console.log(`   ✅ Successful: ${successCount}/${seeds.length}`);
    console.log(`   ❌ Failed: ${failCount}/${seeds.length}`);

    if (failCount > 0) {
        console.log('\n⚠️  Some seeds failed. Please check the errors above.');
        process.exit(1);
    } else {
        console.log('\n✨ All seeds completed successfully!');
        process.exit(0);
    }
};

// Chạy seed all
seedAll();

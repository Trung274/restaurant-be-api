const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    // Basic Info
    name: {
        type: String,
        required: [true, 'Please provide customer name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone number'],
        unique: true,
        trim: true,
        maxlength: [20, 'Phone number cannot be more than 20 characters']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    avatar: {
        type: String,
        trim: true,
        default: 'https://i.pravatar.cc/150?img=0'
    },

    // Membership
    membershipTier: {
        type: String,
        enum: {
            values: ['bronze', 'silver', 'gold', 'vip'],
            message: 'Membership tier must be: bronze, silver, gold, or vip'
        },
        default: 'bronze'
    },
    points: {
        type: Number,
        default: 0,
        min: [0, 'Points cannot be negative']
    },

    // Statistics (auto-calculated)
    totalOrders: {
        type: Number,
        default: 0,
        min: [0, 'Total orders cannot be negative']
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: [0, 'Total spent cannot be negative']
    },
    averageRating: {
        type: Number,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    },
    lastVisit: {
        type: Date
    },

    // Additional Info
    isFavorite: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot be more than 500 characters']
    },

    // Soft delete
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
customerSchema.index({ phone: 1 });
customerSchema.index({ membershipTier: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ totalSpent: -1 });
customerSchema.index({ lastVisit: -1 });

// Virtual for membership badge color
customerSchema.virtual('tierColor').get(function () {
    const colors = {
        bronze: '#CD7F32',
        silver: '#C0C0C0',
        gold: '#FFD700',
        vip: '#9B59B6'
    };
    return colors[this.membershipTier] || '#808080';
});

// Method to update stats
customerSchema.methods.updateStats = async function (orderAmount) {
    this.totalOrders += 1;
    this.totalSpent += orderAmount;
    this.lastVisit = new Date();

    // Auto-upgrade tier based on spending
    if (this.totalSpent >= 50000000) {
        this.membershipTier = 'vip';
    } else if (this.totalSpent >= 20000000) {
        this.membershipTier = 'gold';
    } else if (this.totalSpent >= 5000000) {
        this.membershipTier = 'silver';
    }

    await this.save();
};

module.exports = mongoose.model('Customer', customerSchema);

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [200, 'Notes cannot be more than 200 characters']
    },

    // 🔥 Kitchen-specific fields
    kitchenStatus: {
        type: String,
        enum: {
            values: ['queued', 'preparing', 'ready', 'served'],
            message: 'Kitchen status must be: queued, preparing, ready, served'
        },
        default: 'queued'
    },

    // Priority for rush items
    priority: {
        type: String,
        enum: ['normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Chef assigned to this item
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Time tracking
    estimatedTime: {
        type: Number,  // minutes
        min: 0
    },
    actualTime: {
        type: Number,  // minutes (calculated)
        min: 0
    },

    // Item-level timestamps
    queuedAt: {
        type: Date,
        default: Date.now
    },
    startedAt: Date,
    readyAt: Date,
    servedAt: Date
}, { _id: true });

const orderSchema = new mongoose.Schema({
    // Table Reference
    tableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: [true, 'Please provide table ID']
    },
    tableNumber: {
        type: String,
        required: [true, 'Please provide table number'],
        trim: true
    },

    // Customer Reference (optional - for members)
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },

    // Guest Info (for non-members)
    guestInfo: {
        name: {
            type: String,
            trim: true,
            maxlength: [100, 'Guest name cannot be more than 100 characters']
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [20, 'Phone number cannot be more than 20 characters']
        }
    },

    // Order Status (computed from items' kitchen status)
    status: {
        type: String,
        enum: {
            values: ['pending', 'in-progress', 'ready', 'completed', 'cancelled'],
            message: 'Status must be: pending, in-progress, ready, completed, cancelled'
        },
        default: 'pending'
    },

    // Order Items
    items: [orderItemSchema],

    // Guest Information
    numberOfGuests: {
        type: Number,
        required: [true, 'Please provide number of guests'],
        min: [1, 'Number of guests must be at least 1']
    },

    // Timestamps
    checkInTime: {
        type: Date,
        required: [true, 'Please provide check-in time'],
        default: Date.now
    },
    checkOutTime: {
        type: Date
    },

    // Payment
    subtotal: {
        type: Number,
        default: 0,
        min: [0, 'Subtotal cannot be negative']
    },
    tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative']
    },
    serviceCharge: {
        type: Number,
        default: 0,
        min: [0, 'Service charge cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    totalAmount: {
        type: Number,
        default: 0,
        min: [0, 'Total amount cannot be negative']
    },

    // Payment Details
    paymentMethod: {
        type: String,
        enum: {
            values: ['cash', 'card', 'others', 'bank-transfer'],
            message: 'Payment method must be one of: cash, card, others, bank-transfer'
        }
    },
    paymentStatus: {
        type: String,
        enum: {
            values: ['pending', 'paid', 'refunded'],
            message: 'Payment status must be one of: pending, paid, refunded'
        },
        default: 'pending'
    },

    // Notes
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot be more than 500 characters']
    },

    // Staff tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    servedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
orderSchema.index({ tableId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'items.kitchenStatus': 1 });
orderSchema.index({ checkInTime: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerId: 1 });

// Virtual for duration
orderSchema.virtual('duration').get(function () {
    const endTime = this.checkOutTime || new Date();
    const diff = endTime - this.checkInTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
});

// Virtual: Kitchen progress percentage
orderSchema.virtual('kitchenProgress').get(function () {
    if (!this.items || this.items.length === 0) return 0;
    const completedItems = this.items.filter(item =>
        item.kitchenStatus === 'ready' || item.kitchenStatus === 'served'
    ).length;
    return Math.round((completedItems / this.items.length) * 100);
});

// Method to calculate total amount
orderSchema.methods.calculateTotal = function () {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalAmount = this.subtotal + this.tax + this.serviceCharge - this.discount;
    return this.totalAmount;
};

// Method: Update order status based on items' kitchen status
orderSchema.methods.updateOrderStatus = function () {
    const items = this.items;

    if (!items || items.length === 0) {
        this.status = 'pending';
        return;
    }

    const statuses = items.map(item => item.kitchenStatus);

    // All items served → completed
    if (statuses.every(s => s === 'served')) {
        this.status = 'completed';
        if (!this.checkOutTime) this.checkOutTime = new Date();
    }
    // All items ready → ready
    else if (statuses.every(s => s === 'ready' || s === 'served')) {
        this.status = 'ready';
    }
    // Some items preparing → in-progress
    else if (statuses.some(s => s === 'preparing')) {
        this.status = 'in-progress';
    }
    // All items queued → pending
    else if (statuses.every(s => s === 'queued')) {
        this.status = 'pending';
    }
};

// Method: Update specific item's kitchen status
orderSchema.methods.updateItemKitchenStatus = function (itemId, newStatus, userId) {
    const item = this.items.id(itemId);
    if (!item) throw new Error('Item not found');

    item.kitchenStatus = newStatus;

    // Update timestamps
    const now = new Date();
    switch (newStatus) {
        case 'preparing':
            item.startedAt = now;
            if (userId) item.assignedTo = userId;
            break;
        case 'ready':
            item.readyAt = now;
            if (item.startedAt) {
                item.actualTime = Math.round((now - item.startedAt) / 60000);
            }
            break;
        case 'served':
            item.servedAt = now;
            break;
    }

    // Auto-update order status
    this.updateOrderStatus();
};

// Pre-save hook to calculate totals
orderSchema.pre('save', function (next) {
    if (this.items && this.items.length > 0) {
        this.calculateTotal();
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);

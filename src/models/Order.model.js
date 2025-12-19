const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
    },
    name: {
        type: String,
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
    }
}, { _id: false });

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

    // Order Status
    status: {
        type: String,
        enum: {
            values: ['active', 'completed', 'cancelled'],
            message: 'Status must be one of: active, completed, cancelled'
        },
        default: 'active'
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
            values: ['cash', 'card', 'e-wallet', 'bank-transfer'],
            message: 'Payment method must be one of: cash, card, e-wallet, bank-transfer'
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
orderSchema.index({ checkInTime: -1 });
orderSchema.index({ createdAt: -1 });

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

// Method to calculate total amount
orderSchema.methods.calculateTotal = function () {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalAmount = this.subtotal + this.tax + this.serviceCharge - this.discount;
    return this.totalAmount;
};

// Pre-save hook to calculate totals
orderSchema.pre('save', function (next) {
    if (this.items && this.items.length > 0) {
        this.calculateTotal();
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);

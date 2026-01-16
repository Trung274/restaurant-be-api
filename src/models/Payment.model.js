const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // Order Reference
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Please provide order ID']
    },
    tableNumber: {
        type: String,
        required: [true, 'Please provide table number'],
        trim: true
    },

    // Payment Amount
    amount: {
        type: Number,
        required: [true, 'Please provide payment amount'],
        min: [0, 'Amount cannot be negative']
    },

    // Payment Method
    paymentMethod: {
        type: String,
        required: [true, 'Please provide payment method'],
        enum: {
            values: ['cash', 'card', 'others', 'bank-transfer'],
            message: 'Payment method must be one of: cash, card, others, bank-transfer'
        }
    },

    // Payment Status
    status: {
        type: String,
        enum: {
            values: ['paid'],
            message: 'Payment status must be: paid'
        },
        default: 'paid'
    },

    // Staff Tracking
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide processor ID']
    },

    // Timestamps
    paidAt: {
        type: Date,
        default: Date.now
    },

    // Additional Info
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot be more than 500 characters']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ paidAt: -1 });
paymentSchema.index({ processedBy: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    // --- Static Info (Configuration) ---
    number: {
        type: String,
        required: [true, 'Please provide a table number'],
        trim: true,
        unique: true,
        maxlength: [10, 'Table number cannot be more than 10 characters']
    },
    capacity: {
        type: Number,
        required: [true, 'Please provide table capacity'],
        min: [1, 'Capacity must be at least 1'],
        max: [20, 'Capacity cannot exceed 20']
    },
    floor: {
        type: String,
        required: [true, 'Please provide floor information'],
        trim: true,
        maxlength: [50, 'Floor name cannot be more than 50 characters']
    },
    section: {
        type: String,
        required: [true, 'Please provide section information'],
        trim: true,
        enum: {
            values: ['Main', 'VIP', 'Outdoor'],
            message: 'Section must be one of: Main, VIP, Outdoor'
        }
    },

    // --- Real-time Status (The "Live" State) ---
    status: {
        type: String,
        enum: {
            values: ['available', 'occupied', 'reserved', 'cleaning'],
            message: 'Status must be one of: available, occupied, reserved, cleaning'
        },
        default: 'available'
    },

    // --- Active Session Info (Transient Data) ---
    activeSession: {
        currentGuests: {
            type: Number,
            min: [0, 'Current guests cannot be negative']
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        checkInTime: {
            type: Date
        },
        // For Reservation
        reservationTime: {
            type: Date
        },
        customerName: {
            type: String,
            trim: true,
            maxlength: [100, 'Customer name cannot be more than 100 characters']
        },
        customerPhone: {
            type: String,
            trim: true,
            maxlength: [20, 'Phone number cannot be more than 20 characters']
        }
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
tableSchema.index({ status: 1 });
tableSchema.index({ floor: 1 });
tableSchema.index({ section: 1 });
tableSchema.index({ number: 1 });

// Virtual for duration (how long the table has been occupied)
tableSchema.virtual('duration').get(function () {
    if (this.status === 'occupied' && this.activeSession?.checkInTime) {
        const now = new Date();
        const diff = now - this.activeSession.checkInTime;
        const minutes = Math.floor(diff / 60000);
        return `${minutes} mins`;
    }
    return null;
});

// Method to clear active session
tableSchema.methods.clearSession = function () {
    this.activeSession = {
        currentGuests: undefined,
        orderId: undefined,
        checkInTime: undefined,
        reservationTime: undefined,
        customerName: undefined,
        customerPhone: undefined
    };
};

module.exports = mongoose.model('Table', tableSchema);

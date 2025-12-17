const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a menu item name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        trim: true,
        enum: {
            values: ['Món chính', 'Khai vị', 'Món đặc biệt', 'Đồ uống', 'Tráng miệng'],
            message: 'Category must be one of: Món chính, Khai vị, Món đặc biệt, Đồ uống, Tráng miệng'
        }
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
        min: [0, 'Price cannot be negative']
    },
    image: {
        type: String,
        required: [true, 'Please provide an image URL'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot be more than 5']
    },
    reviews: {
        type: Number,
        default: 0,
        min: [0, 'Reviews count cannot be negative']
    },
    status: {
        type: String,
        enum: {
            values: ['available', 'out_of_stock', 'discontinued'],
            message: 'Status must be one of: available, out_of_stock, discontinued'
        },
        default: 'available'
    },
    popular: {
        type: Boolean,
        default: false
    },
    spicy: {
        type: Boolean,
        default: false
    },
    vegetarian: {
        type: Boolean,
        default: false
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
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ status: 1 });
menuItemSchema.index({ popular: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ name: 'text', description: 'text' }); // Text search

// Virtual for formatted price (VND)
menuItemSchema.virtual('formattedPrice').get(function () {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.price);
});

module.exports = mongoose.model('MenuItem', menuItemSchema);

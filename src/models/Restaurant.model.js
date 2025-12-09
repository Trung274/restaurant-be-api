const mongoose = require('mongoose');
const validator = require('validator');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide restaurant name'],
    trim: true,
    maxlength: [100, 'Restaurant name cannot be more than 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10,11}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Please provide a valid phone number'
    }
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  address: {
    type: String,
    required: [true, 'Please provide restaurant address'],
    trim: true
  },
  openTime: {
    type: String,
    required: [true, 'Please provide opening time'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Please provide time in format HH:MM (e.g., 08:00)'
    }
  },
  closeTime: {
    type: String,
    required: [true, 'Please provide closing time'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Please provide time in format HH:MM (e.g., 22:00)'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  logo: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
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

// Virtual field để kiểm tra nhà hàng có đang mở cửa không
restaurantSchema.virtual('isOpen').get(function() {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return currentTime >= this.openTime && currentTime <= this.closeTime;
});

// Đảm bảo chỉ có 1 document duy nhất (singleton pattern)
restaurantSchema.statics.getInstance = async function() {
  let restaurant = await this.findOne();
  if (!restaurant) {
    // Tạo mặc định nếu chưa có
    restaurant = await this.create({
      name: 'Tên nhà hàng',
      phone: '0000000000',
      email: 'restaurant@example.com',
      address: 'Địa chỉ nhà hàng',
      openTime: '08:00',
      closeTime: '22:00',
      description: 'Mô tả nhà hàng'
    });
  }
  return restaurant;
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
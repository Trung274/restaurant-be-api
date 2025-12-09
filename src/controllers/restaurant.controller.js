const Restaurant = require('../models/Restaurant.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get restaurant info
// @route   GET /api/v1/restaurant
// @access  Private/Admin
exports.getRestaurant = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.getInstance();

  res.status(200).json({
    success: true,
    data: restaurant
  });
});

// @desc    Update restaurant info
// @route   PUT /api/v1/restaurant
// @access  Private/Admin
exports.updateRestaurant = asyncHandler(async (req, res, next) => {
  const { name, phone, email, address, openTime, closeTime, description, logo, isActive } = req.body;

  let restaurant = await Restaurant.findOne();

  if (!restaurant) {
    return next(new ErrorResponse('Restaurant not found', 404));
  }

  restaurant = await Restaurant.findByIdAndUpdate(
    restaurant._id,
    { 
      name, 
      phone, 
      email, 
      address, 
      openTime, 
      closeTime, 
      description,
      logo,
      isActive,
      updatedBy: req.user._id
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Restaurant updated successfully',
    data: restaurant
  });
});
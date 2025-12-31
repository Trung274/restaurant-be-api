const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const total = await User.countDocuments();
  const users = await User.find()
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: users
  });
});

// @desc    Get user statistics
// @route   GET /api/v1/users/stats
// @access  Private/Admin/Manager
exports.getUserStats = asyncHandler(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const inactiveUsers = await User.countDocuments({ isActive: false });

  // Group by role
  const usersByRole = await User.aggregate([
    {
      $lookup: {
        from: 'roles',
        localField: 'role',
        foreignField: '_id',
        as: 'roleInfo'
      }
    },
    {
      $unwind: '$roleInfo'
    },
    {
      $group: {
        _id: '$roleInfo.name',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        role: '$_id',
        count: 1
      }
    }
  ]);

  // Group by work status
  const usersByWorkStatus = await User.aggregate([
    {
      $group: {
        _id: '$workStatus',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1
      }
    }
  ]);

  // Group by shift
  const usersByShift = await User.aggregate([
    {
      $group: {
        _id: '$shift',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        shift: '$_id',
        count: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: usersByRole,
      byWorkStatus: usersByWorkStatus,
      byShift: usersByShift
    }
  });
});


// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Users can only view their own profile unless they're admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view this user', 403));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  const isOwner = req.user.id === req.params.id;
  const isAdmin = req.user.role.name === 'admin';
  const isManager = req.user.role.name === 'manager';

  // Authorization: Owner, Admin, or Manager
  if (!isOwner && !isAdmin && !isManager) {
    return next(new ErrorResponse('Not authorized to update this user', 403));
  }

  const fieldsToUpdate = {};

  // Standard fields - Owner or Admin only
  if (isOwner || isAdmin) {
    if (req.body.name !== undefined) fieldsToUpdate.name = req.body.name;
    if (req.body.email !== undefined) fieldsToUpdate.email = req.body.email;
    if (req.body.avatar !== undefined) fieldsToUpdate.avatar = req.body.avatar;
    if (req.body.phone !== undefined) fieldsToUpdate.phone = req.body.phone;
    if (req.body.bio !== undefined) fieldsToUpdate.bio = req.body.bio;
  }

  // Admin only fields
  if (isAdmin) {
    if (req.body.role) fieldsToUpdate.role = req.body.role;
    if (req.body.isActive !== undefined) fieldsToUpdate.isActive = req.body.isActive;
  }

  // Admin & Manager fields (Shift & Work Status)
  if (isAdmin || isManager) {
    if (req.body.shift !== undefined) fieldsToUpdate.shift = req.body.shift;
    if (req.body.workStatus !== undefined) fieldsToUpdate.workStatus = req.body.workStatus;
  }

  // If no fields allowed to update
  if (Object.keys(fieldsToUpdate).length === 0) {
    return next(new ErrorResponse('No valid fields to update', 400));
  }


  const user = await User.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: {}
  });
});

// @desc    Change password
// @route   PUT /api/v1/users/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current password and new password', 400));
  }

  // Validate new password length
  if (newPassword.length < 6) {
    return next(new ErrorResponse('New password must be at least 6 characters', 400));
  }

  // Get user with password field
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Verify current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  // Update password and timestamp
  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});
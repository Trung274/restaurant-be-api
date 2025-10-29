const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new ErrorResponse('User already exists', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password
  });

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
      refreshToken
    }
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  // Check user exists
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ErrorResponse('Account is deactivated', 401));
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token,
      refreshToken
    }
  });
});

// @desc    Refresh token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ErrorResponse('Please provide refresh token', 400));
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return next(new ErrorResponse('Invalid refresh token', 401));
  }

  // Find user and check if refresh token exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
  if (!tokenExists) {
    return next(new ErrorResponse('Invalid refresh token', 401));
  }

  // Generate new tokens
  const newToken = generateToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  // Remove old refresh token and add new one
  user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
  user.refreshTokens.push({ token: newRefreshToken });
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token: newToken,
      refreshToken: newRefreshToken
    }
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Remove specific refresh token
    req.user.refreshTokens = req.user.refreshTokens.filter(
      rt => rt.token !== refreshToken
    );
  } else {
    // Remove all refresh tokens (logout from all devices)
    req.user.refreshTokens = [];
  }

  await req.user.save();

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});
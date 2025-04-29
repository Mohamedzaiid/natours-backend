const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');

// Get the user's wishlist
exports.getWishlist = catchAsync(async (req, res, next) => {
  // Get the user with populated wishlist
  const user = await User.findById(req.user.id).populate({
    path: 'wishlist',
    select: 'name price ratingsAverage imageCover slug duration',
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      wishlist: user.wishlist || [],
    },
  });
});

// Add a tour to wishlist
exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { tourId } = req.body;

  // Check if the tour exists
  const tour = await Tour.findById(tourId);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  // Add the tour to the user's wishlist if it's not already there
  const user = await User.findById(req.user.id);

  // Convert wishlist items to strings for comparison
  const wishlistIds = user.wishlist.map((id) => id.toString());

  // Only add if not already in wishlist
  if (!wishlistIds.includes(tourId)) {
    user.wishlist.push(tourId);
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    status: 'success',
    message: 'Tour added to wishlist',
    data: {
      wishlist: user.wishlist,
    },
  });
});

// Remove a tour from wishlist
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { tourId } = req.params;

  // Check if the tour exists
  const tour = await Tour.findById(tourId);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  // Remove the tour from the user's wishlist
  const user = await User.findById(req.user.id);

  // Filter out the tour ID
  user.wishlist = user.wishlist.filter((id) => id.toString() !== tourId);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Tour removed from wishlist',
    data: {
      wishlist: user.wishlist,
    },
  });
});

// Clear the entire wishlist
exports.clearWishlist = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Clear the wishlist
  user.wishlist = [];
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Wishlist cleared',
    data: {
      wishlist: [],
    },
  });
});

// Sync wishlist with local storage
exports.syncWishlist = catchAsync(async (req, res, next) => {
  const { wishlistItems } = req.body;

  if (!Array.isArray(wishlistItems)) {
    return next(new AppError('Wishlist items must be an array', 400));
  }

  // Validate all tour IDs
  const validTours = await Tour.find({ _id: { $in: wishlistItems } });
  const validTourIds = validTours.map((tour) => tour._id.toString());

  // Update user's wishlist
  const user = await User.findById(req.user.id);
  user.wishlist = validTourIds;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Wishlist synced successfully',
    data: {
      wishlist: user.wishlist,
    },
  });
});

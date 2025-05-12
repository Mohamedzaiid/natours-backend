const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Consolidated dashboard data endpoint to fetch all necessary dashboard data in one request
exports.getDashboardData = catchAsync(async (req, res, next) => {
  // 1) Get counts using countDocuments() for efficiency
  const [userCount, tourCount, bookingCount, reviewCount] = await Promise.all([
    User.countDocuments(),
    Tour.countDocuments(),
    Booking.countDocuments(),
    Review.countDocuments(),
  ]);

  // 2) Get recent users (5 most recent)
  const recentUsers = await User.find()
    .sort('-createdAt')
    .limit(5)
    .select('name email role photo createdAt');

  // 3) Get recent bookings (5 most recent)
  const recentBookings = await Booking.find()
    .sort('-createdAt')
    .limit(5)
    .populate({
      path: 'user',
      select: 'name',
    })
    .populate({
      path: 'tour',
      select: 'name',
    });

  // 4) Get top tours (5 highest rated)
  const topTours = await Tour.find()
    .sort('-ratingsAverage')
    .limit(5)
    .select('name price ratingsAverage ratingsQuantity difficulty duration');

  // 5) Calculate revenue statistics
  const bookings = await Booking.find().select('price createdAt');

  // Calculate total revenue
  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + booking.price,
    0,
  );

  // Calculate monthly revenue for trend analysis
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const lastMonthBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.createdAt);
    return bookingDate >= lastMonth && bookingDate < now;
  });

  const twoMonthsAgoBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.createdAt);
    return bookingDate >= twoMonthsAgo && bookingDate < lastMonth;
  });

  const lastMonthRevenue = lastMonthBookings.reduce(
    (sum, booking) => sum + booking.price,
    0,
  );
  const twoMonthsAgoRevenue = twoMonthsAgoBookings.reduce(
    (sum, booking) => sum + booking.price,
    0,
  );

  // Calculate trend percentage
  let revenueTrend = 0;
  if (twoMonthsAgoRevenue > 0) {
    revenueTrend =
      ((lastMonthRevenue - twoMonthsAgoRevenue) / twoMonthsAgoRevenue) * 100;
  }

  // 6) Format and return the combined dashboard data
  const dashboardData = {
    counts: {
      users: userCount,
      tours: tourCount,
      bookings: bookingCount,
      reviews: reviewCount,
    },
    revenue: {
      total: totalRevenue,
      lastMonth: lastMonthRevenue,
      twoMonthsAgo: twoMonthsAgoRevenue,
      trend: Math.round(revenueTrend),
    },
    recentUsers: recentUsers.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
      joined: user.createdAt,
    })),
    recentBookings: recentBookings.map((booking) => ({
      id: booking._id,
      tour: booking.tour ? booking.tour.name : 'Unknown Tour',
      user: booking.user ? booking.user.name : 'Unknown User',
      price: booking.price,
      date: booking.createdAt,
      status: booking.paid ? 'Paid' : 'Pending',
    })),
    topTours: topTours.map((tour) => ({
      id: tour._id,
      name: tour.name,
      price: tour.price,
      ratingsAverage: tour.ratingsAverage,
      ratingsQuantity: tour.ratingsQuantity,
      difficulty: tour.difficulty,
      duration: tour.duration,
    })),
  };

  // Set cache headers (15 minutes)
  res.set('Cache-Control', 'public, max-age=900');

  // Send response
  res.status(200).json({
    status: 'success',
    data: dashboardData,
  });
});

// Add more consolidated endpoints as needed
exports.getUsersWithBookingsAndReviews = catchAsync(async (req, res, next) => {
  const userId = req.params.id;

  // Fetch user data along with their bookings and reviews
  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  const [bookings, reviews] = await Promise.all([
    Booking.find({ user: userId }).populate({
      path: 'tour',
      select: 'name imageCover price',
    }),
    Review.find({ user: userId }).populate({
      path: 'tour',
      select: 'name imageCover',
    }),
  ]);

  // Format the response
  const userData = {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
      active: user.active,
      createdAt: user.createdAt,
    },
    bookings: bookings.map((booking) => ({
      id: booking._id,
      tour: booking.tour
        ? {
            id: booking.tour._id,
            name: booking.tour.name,
            imageCover: booking.tour.imageCover,
          }
        : null,
      price: booking.price,
      paid: booking.paid,
      createdAt: booking.createdAt,
    })),
    reviews: reviews.map((review) => ({
      id: review._id,
      tour: review.tour
        ? {
            id: review.tour._id,
            name: review.tour.name,
            imageCover: review.tour.imageCover,
          }
        : null,
      rating: review.rating,
      review: review.review,
      createdAt: review.createdAt,
    })),
  };

  // Set cache headers (5 minutes)
  res.set('Cache-Control', 'public, max-age=300');

  // Send response
  res.status(200).json({
    status: 'success',
    data: userData,
  });
});

// Get a tour with its reviews and bookings
exports.getTourWithReviewsAndBookings = catchAsync(async (req, res, next) => {
  const tourId = req.params.id;

  // Fetch tour data along with reviews and bookings
  const tour = await Tour.findById(tourId);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  const [reviews, bookings] = await Promise.all([
    Review.find({ tour: tourId }).populate({
      path: 'user',
      select: 'name photo',
    }),
    Booking.find({ tour: tourId }).populate({
      path: 'user',
      select: 'name email',
    }),
  ]);

  // Format the response
  const tourData = {
    tour: tour,
    reviews: reviews.map((review) => ({
      id: review._id,
      user: review.user
        ? {
            id: review.user._id,
            name: review.user.name,
            photo: review.user.photo,
          }
        : null,
      rating: review.rating,
      review: review.review,
      createdAt: review.createdAt,
    })),
    bookings: bookings.map((booking) => ({
      id: booking._id,
      user: booking.user
        ? {
            id: booking.user._id,
            name: booking.user.name,
            email: booking.user.email,
          }
        : null,
      price: booking.price,
      paid: booking.paid,
      createdAt: booking.createdAt,
    })),
  };

  // Set cache headers (5 minutes)
  res.set('Cache-Control', 'public, max-age=300');

  // Send response
  res.status(200).json({
    status: 'success',
    data: tourData,
  });
});

// Get all active tours with guides
exports.getActiveToursWithGuides = catchAsync(async (req, res, next) => {
  // Fetch all active tours with their guides
  const tours = await Tour.find({ active: { $ne: false } }).populate({
    path: 'guides',
    select: 'name email photo role',
  });

  // Set cache headers (10 minutes)
  res.set('Cache-Control', 'public, max-age=600');

  // Send response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

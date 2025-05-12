const express = require('express');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authControllers');

const router = express.Router();

// Protect all routes - only authenticated users can access these routes
router.use(authController.protect);

// Restrict to admin and lead-guide roles
router.use(authController.restrictTo('admin', 'lead-guide'));

// Consolidated dashboard data endpoint
router.get('/dashboard-data', adminController.getDashboardData);

// User with bookings and reviews
router.get(
  '/users/:id/details',
  adminController.getUsersWithBookingsAndReviews,
);

// Tour with reviews and bookings
router.get('/tours/:id/details', adminController.getTourWithReviewsAndBookings);

// Active tours with guides
router.get(
  '/active-tours-with-guides',
  adminController.getActiveToursWithGuides,
);

module.exports = router;

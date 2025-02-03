const express = require('express');
const bookingController = require('../controllers/bookingControllers');
const authController = require('../controllers/authControllers');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// Only admin and lead-guide can access these routes
router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;

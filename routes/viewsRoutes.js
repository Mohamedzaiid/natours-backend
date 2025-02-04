const express = require('express');
const viewsController = require('../controllers/viewsControllers');
const authController = require('../controllers/authControllers');
// const bookingController = require('../controllers/bookingControllers');

const router = express.Router();

router.use(viewsController.alerts);

router.get(
  '/',
  // bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview,
);
router.get(
  '/tour/:slug',
  authController.isLoggedIn,
  viewsController.getTourForm,
);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/my-account', authController.protect, viewsController.getAccount);
router.get(
  '/my-bookings',
  authController.protect,
  viewsController.getMyBookings,
);

module.exports = router;

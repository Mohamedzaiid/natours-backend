const express = require('express');
const wishlistController = require('../controllers/wishlistControllers');
const authController = require('../controllers/authControllers');

const router = express.Router();

// Protect all routes after this middleware - only authenticated users can access these routes
router.use(authController.protect);

router
  .route('/')
  .get(wishlistController.getWishlist)
  .post(wishlistController.addToWishlist)
  .delete(wishlistController.clearWishlist);

router.post('/sync', wishlistController.syncWishlist);

router.delete('/:tourId', wishlistController.removeFromWishlist);

module.exports = router;

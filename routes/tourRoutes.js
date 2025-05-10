const express = require('express');
const tourController = require('../controllers/tourControllers');
const authController = require('../controllers/authControllers');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

//nested routes
router.use('/:tourId/reviews', reviewRouter);
// router.param('id', tourController.checkID);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/search').get(tourController.searchTours);

router.route('/tours-stats').get(tourController.getTourStats);

router
  .route('/tour-within/:distance/center/:latLng/unit/:unit')
  .get(tourController.getTourWithIn);

router.route('/distances/:latLng/unit/:unit').get(tourController.getDistances);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-gide', 'guide'),
    tourController.getMonthlyPlan,
  );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.createNewTour,
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;

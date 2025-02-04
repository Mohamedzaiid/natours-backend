const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      "Your bookings was successful! please check your email for confirmation, If your booking doesn't show up here immediatly, Please come back later!";
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) Get all data for the collection
  const tours = await Tour.find();
  //2)build the template
  //3)render that template using the data form 1)

  res.status(200).render('overview', {
    title: 'All Tour',
    tours,
  });
});

exports.getTourForm = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res, next) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "script-src 'self' https://unpkg.com/axios@1.6.7/dist/axios.min.js 'unsafe-inline' 'unsafe-eval';",
    )
    .render('login', {
      title: 'Log into your account',
    });
};

exports.getAccount = (req, res, next) => {
  res.status(200).render('account', {
    title: 'My Account',
  });
};
exports.getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render('overview', {
    title: 'My Bookings',
    tours,
  });
});

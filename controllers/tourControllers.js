const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const APIFeatures = require('../utils/apiFeatures');

const storage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image, Please Upload Only Images!', 400), false);
  }
};
const upload = multer({
  storage: storage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  //1) resizing image cover
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);
  //2) resizing images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }),
  );
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,difficulty,summary,ratingsAverage,imageCover';
  next();
};

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRatings: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { Month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTours: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    result: plan.length,
    data: {
      plan,
    },
  });
});

exports.getTourWithIn = catchAsync(async (req, res, next) => {
  const { distance, latLng, unit } = req.params;
  const [lat, lng] = latLng.split(',');
  const raduis = unit === 'mi' ? distance / 6963.2 : distance / 6378.1;

  if (!lat || !lng)
    next(
      new AppError(
        'Please provide the latitude and the longtuide in format lat,lng',
        400,
      ),
    );

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], raduis] } },
  });

  res.status(200).json({
    status: 'sucess',
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latLng, unit } = req.params;
  const [lat, lng] = latLng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    next(
      new AppError(
        'Please provide the latitude and the longtuide in format lat,lng',
        400,
      ),
    );

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'sucess',
    data: {
      data: distances,
    },
  });
});

exports.getAllTours = factory.getAllData(Tour);
exports.createNewTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// Advanced search functionality with AI suggestions
exports.searchTours = catchAsync(async (req, res, next) => {
  // Get the query parameters
  const { name, location, date, difficulty, duration, maxGroupSize, price } =
    req.query;

  // Build a search query object
  const searchQuery = {};

  // Add filters based on provided parameters
  if (name) {
    // Search by name, summary, or description with case-insensitive search
    searchQuery.$or = [
      { name: { $regex: name, $options: 'i' } },
      { summary: { $regex: name, $options: 'i' } },
      { description: { $regex: name, $options: 'i' } },
    ];
  }

  if (location) {
    // Search by location names or starting location
    searchQuery.$or = searchQuery.$or || [];
    searchQuery.$or.push(
      { 'startLocation.description': { $regex: location, $options: 'i' } },
      { 'locations.description': { $regex: location, $options: 'i' } },
    );
  }

  if (date) {
    // This would require parsing the date string and finding tours with start dates
    // around that period. Simplified version for demonstration:
    const dateObj = new Date(date);
    if (!Number.isNaN(dateObj.getTime())) {
      // If valid date, find tours starting after this date
      searchQuery.startDates = { $gte: dateObj };
    }
  }

  if (difficulty) {
    searchQuery.difficulty = difficulty.toLowerCase();
  }

  if (duration) {
    // Range search for duration
    const [min, max] = duration.split('-').map(Number);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      searchQuery.duration = { $gte: min, $lte: max };
    } else if (!Number.isNaN(min)) {
      searchQuery.duration = { $gte: min };
    }
  }

  if (maxGroupSize) {
    // Find tours that can accommodate at least the specified group size
    searchQuery.maxGroupSize = { $gte: parseInt(maxGroupSize, 10) };
  }

  if (price) {
    // Range search for price
    const [min, max] = price.split('-').map(Number);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      searchQuery.price = { $gte: min, $lte: max };
    } else if (!Number.isNaN(min)) {
      searchQuery.price = { $gte: min };
    }
  }

  // Execute the search query
  const features = new APIFeatures(Tour.find(searchQuery), req.query)
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  // Return the results
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

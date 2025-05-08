const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewScheme = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      required: [true, 'Please enter your rating'],
      minLength: [1, 'The rating must between 1 to 5'],
      maxLength: [5, 'The rating must between 1 to 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewScheme.pre(/^find/, function (next) {
  this.populate({
    path: 'tour',
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name photo',
  });
  // this.populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  next();
});

reviewScheme.index({ tour: 1, user: 1 }, { unique: true });

reviewScheme.statics.calculateRantingsAndAverage = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);

  //check if ther is a stats "the tour has reviews" if not set the default values
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

//calculate the stats at creating new review
reviewScheme.post('save', function () {
  //this ponits to the current reveiw
  // const Review = mongoose.model('Review');
  this.constructor.calculateRantingsAndAverage(this.tour);
});
//calculate the stats when update the review or delete it form database
// reviewScheme.pre(/^findOneAnd/, async function (next) {
//   //save at this.r the qurey before execute it so we can get the new data added to the tour
//   this.r = await this.model.findOne(this.getQuery());
//   console.log(this.r);
//   next();
// });

reviewScheme.post(/^findOneAnd/, async (doc) => {
  //at this middleware we have the acess on the query from this.r so we have the id of tour and reviews and we can calculate the stats
  if (doc) {
    await doc.constructor.calculateRantingsAndAverage(doc.tour);
  }
});

const Review = mongoose.model('Review', reviewScheme);

module.exports = Review;

const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./usermodel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour Must Have A Name'],
      unique: true,
      trim: true,
      minLength: [10, 'The Name Must be Between 10 To 40'],
      maxLength: [40, 'The Name Must be Between 10 To 40'],
      // validate: [validator.isAlpha, 'Tour Name Must Only Contain Character'],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'The Duration Must Be Added'],
    },
    difficulty: {
      type: String,
      required: [true, 'The Difficulty Must Be Added'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        massage: 'Difficulty is either : easy, medium, difficult',
      },
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'The Max Group Must Be Added'],
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      adress: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        adress: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    ratingsAverage: {
      type: Number,
      default: 4.5,
      minLength: [1, 'The Rating Must be Between 1 To 5'],
      maxLength: [5, 'The Rating Must be Between 1 To 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A Tour Must Have A Price'],
    },
    priceDiscount: {
      type: Number,
      //this validation run just when we create a new tour not for uptading
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        massage:
          'The Discount Price ({VALUE} Must Be Less Than The Normal price)',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A Tour Must Have A summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour Must Have A Cover Image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: Boolean,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
//embeding users in tour document
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
// Document Mideleware for Mongodb
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//Query MideleWare for mongodb

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

// tourSchema.post(/^find/, (docs, next) => {
//   console.log(docs);
//   next();
// })

// Aggregation MideleWare

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

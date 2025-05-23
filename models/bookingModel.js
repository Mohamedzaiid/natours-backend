const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Booking must belong to a Tour!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a User!'],
    },
    price: {
      type: Number,
      required: [true, 'Booking must have a price'],
    },
    paid: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  },
);

// Populate user and tour whenever there's a find query
bookingSchema.pre(/^find/, function (next) {
  if (this.options.skipPopulation) return next();
  this.populate('user').populate({
    path: 'tour',
    select: 'name ',
  });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

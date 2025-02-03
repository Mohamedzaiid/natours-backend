const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userScheme = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please Tell Us Your Name'],
    trim: true,
    minLength: [1, 'the min name 10 character'],
    maxLength: [100, 'max length is 40 character'],
  },
  email: {
    type: String,
    required: [true, 'Please Provide Your Name'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Enter A Valid Email'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'Please Enter A Password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please Provide Us With The password Confrimation'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords Are Not The Same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
//middleware before any query excutied
userScheme.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
userScheme.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userScheme.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userScheme.methods.correctPassword = async function (enteredPass, userPass) {
  return await bcrypt.compare(enteredPass, userPass);
};

userScheme.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userScheme.methods.createPasswordResetToken = function () {
  const restToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(restToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // console.log({ restToken }, this.passwordResetToken);
  return restToken;
};
const User = mongoose.model('User', userScheme);

module.exports = User;

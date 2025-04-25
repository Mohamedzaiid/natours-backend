const crypto = require('crypto');
// const { promisify } = require('util');
const util = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };
  // if (req.secure || req.headers['x-forwarded-ror']) cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/my-account`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // ckeck if email and password exist

  if (!email || !password) {
    return next(new AppError('Please Provide email and password', 400));
  }
  // check if user is exist && the password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email Or Password', 401));
  }
  // if the user exist and the password correct the send token to client
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'Logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
    messsage: 'Logged out successfully!',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // check if token exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }
  // validate token
  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );
  // check if user still exist
  const existingUser = await User.findById(decoded.id);
  if (!existingUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }
  // check if user changed password after the token was issued
  if (existingUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }
  req.user = existingUser;
  res.locals.user = existingUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  // check if token exist
  if (req.cookies.jwt) {
    try {
      const decoded = await util.promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // check if user still exist
      const existingUser = await User.findById(decoded.id);
      if (!existingUser) {
        return next();
      }
      // check if user changed password after the token was issued
      if (existingUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      res.locals.user = existingUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }
  // generate the random reset token
  const restToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // send it to user's email
    const restURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${restToken}`;
    // const messsage = `Forgot Your Password? submit a PATH Request With New Password And PasswordConfirm To: ${restURL},\nif You Don't Please ignore This Email!`;
    await new Email(user, restURL).sendPasswordRest();

    res.status(200).json({
      status: 'success',
      messsage: 'Email Sent sucessfully',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There Was An Error Sending The Email, Try again later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user by token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //if token not expired and there is user ,set password
  if (!user)
    return next(new AppError('The Token is not valid,Try Again Later!', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // change passwordChangedAt we dit it in user scheme
  //log in the user by jwt
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // check if the password is correct
  if (
    !user ||
    !(await user.correctPassword(req.body.currentPassword, user.password))
  )
    return next(new AppError('Incorrect current PassWord', 401));
  //if so set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //log in user
  createSendToken(user, 200, req, res);
});

const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require(`../models/userModel`)
//const sendEmail = require(`../utils/email`)
const { catchAsync } = require(`../utils/catchAsync`);
const AppError = require(`../utils/appError`);

const signToken = (id) => {
  const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

const createSendToken = (user, statusCode, message, res) => {
  const token = signToken(user.id);

  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOption.secure = true; // client cann't access it

  res.cookie('jwt', token, cookieOption); // save jwt in cookie

  //Remove password from output
  user.password = undefined;


  res.status(statusCode).json({
    status: true,
    message,
    data:user,
    token,
  });
};

exports.SignUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  if (!newUser) {
    return next(new AppError(`SomeThing Error cannot sign up`, 404));
  }
  createSendToken(newUser, 201, "sign up successfully", res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) check email && password exist,
  if (!email || !password) {
    return next(new AppError('please provide email & password', 400));
  }

  const user = await User.findOne({ email: email }).select('+password');



  if (
    !user ||
    !(
      (await user.correctPassword(
        password,
        user.password
      ))
    )
  ) {


    return next(new AppError('Incorrect email or password', 400));
  }


  createSendToken(user, 200, 'log in successfully', res);

});

/*
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select(
    'email name'
  );
  if (!user) {

    return next(new AppError('Email not Found.', 404));
  }


  const OTP = await user.generateOtp();
  await user.save({ validateBeforeSave: false });
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password (valid for 10 min)',
      name: user.name,
      otp: OTP,
    });

    res.status(200).json({
      status: true,
      message: 'Code sent to email!',
    });

  } catch (err) {
    user.passwordOtp = undefined;
    user.passwordOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError(err), 500);
  }
});
exports.verifyEmailOtp = catchAsync(async (req, res, next) => {
  //just email otp
  const cryptoOtp = crypto
    .createHash('sha256')
    .update(req.body.otp)
    .digest('hex');

  const user = await User.findOne({
    passwordOtp: cryptoOtp,
    passwordOtpExpires: { $gt: Date.now() },
  });

  if (!user) {


    return next(new AppError('confirmtion code is invalid or has expired', 400));
  }
  const token = signToken(user.id);

  res.status(200).json({
    status: true,
    message: 'confirmtion code is valid You can now reset password',
    token,
  });

});



exports.resetPassword = catchAsync(async (req, res, next) => {
  // protect handler
  const user = req.user;
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordOtp = undefined;
  user.passwordOtpExpires = undefined;

  await user.save({ validateBeforeSave: false });

  res.clearCookie('jwt');
  res.status(200).json({
    status: true,
    message: 'password reset success you can now  try agin to log in',
  });


});
*/
exports.updatePassword = catchAsync(async (req, res, next) => {
  //settings  hy48lha b3d el protect
  // 1) Get user from collection

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new AppError("Account not found", 404));
  }
  // 2) Check if posted current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {

    return next(new AppError("Current password isn't correct", 400));
  }
  if (!req.body.newPassword || !req.body.newPasswordConfirm) {
    return next(new AppError("Please Enter new Password and password Confirm", 400));
  }
  if (req.body.newPassword !== req.body.newPasswordConfirm) {
    return next(new AppError("Password and Password confirm aren't the same", 400));
  }
  if ((await user.correctPassword(req.body.newPassword, user.password))) {
    return next(new AppError("it's the same Password", 400));
  }
  // 3) If so, update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;

  await user.save({ validateBeforeSave: false });
  // 4) Log user in, send JWT

  // createSendToken(user,200,'password has changed successfully, please log in again',res);
  res.status(200).json({
    status: true,
    message: "Password Updated "
  })
}
);

exports.logOut = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: true,
    message: 'You logged out',
    token: ""
  });
});


//MIDDLEWARE CHECK IF USER STILL LOGGED IN
exports.protect = catchAsync(async (req, res, next) => {
  //1)Getting token and check it's there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {

    return next(new AppError("Your're not logged in please log in", 401)); //401 => is not 'authorized
  }
  //2)Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)check if user still exist in the route
  const currentUser = await User.findById(decoded.id).select('-passwordOtp -passwordOtpExpires -passwordChangedAt');
  if (!currentUser) {

    return next(
      new AppError(`Your Session expires please Login again`, 401)
    );
  }
  //4)check if user changed password after the token has issued
  if (currentUser.changesPasswordAfter(decoded.iat)) {
    //iat=> issued at

    return next(
      new AppError(
        'user has changed password recently please log in again',
        401
      )
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser; // pyasse el data le middleware tany
  next();
});


exports.restrictTo = (...roles) => {
  //function feha paramter we 3awz a7oot feha middleware
  //roles ['admin','lead-guide']
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to preform this action', 401)
      );
    }
    next();
  };
};


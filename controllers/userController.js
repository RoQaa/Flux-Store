const User = require('../models/userModel');
const { catchAsync } = require(`../utils/catchAsync`);
const { filterObj } = require(`../utils/filterObj`);
const AppError = require(`../utils/appError`);



// Protect handlers
exports.getUsers = catchAsync(async (req, res, next) => {

    const data = await User.find();
    if (!data) return new AppError(`Not Found`, 404);
    res.status(200).json({
        status: true,
        length: data.length,
        data
    })
})

exports.getOneUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return new AppError(`Not Found`, 404);
    res.status(200).json({
        status: true,
        data: user
    })
})

exports.createUser = catchAsync(async (req, res, next) => {
    const doc = await User.create(req.body);
    res.status(201).json({
        status: true,
        message: "Create User Successfully",
        doc
    })
})

exports.deleteUser = catchAsync(async (req, res, next) => {
    const doc = await User.findByIdAndDelete(req.params.id);
    if (!doc) return new AppError(`Not Found`, 404);
    res.status(200).json({
        status: true,
        message: "User deleted Successfully"
    })
})
exports.updateUser = catchAsync(async (req, res, next) => {
    const filteredBody = filterObj(req.body, 'lName', 'fName', 'email', 'role', 'isActive');
    const doc = await User.findByIdAndUpdate(req.params.id, filteredBody, { new: true, runValidators: true })
    if (!doc) return new AppError(`Not Found`, 404);
    res.status(200).json({
        status: true,
        message: "User Updated Successfully"
    })
})
const _ = require('lodash');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError(`This route is not for password updates. Please use ${req.protocol}://${req.get('host')}/api/v1/users/updateMyPassword`, 400));
    }

    const filterBody = _.pick(req.body, ['name', 'email']);
    if (req.file) filterBody.photo = req.file.filename;

    const user = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;

    next();
}

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'fail',
        message: `This route is not defined! Please use ${req.protocol}://${req.get('host')}/api/v2/users/register instead!`
    });
}

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do NOT update or delete password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
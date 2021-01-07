const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        return cb(null, true);
    }
    return cb(new AppError('Not an image! Please upload only images', 400), false);
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadPhoto = upload.single('photo');

exports.resizeStorePhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    const ext = req.file.mimetype.split('/')[1];
    req.file.filename = `${uuid.v4()}.${ext}`;

    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`public/img/stores/${req.file.filename}`);

    next();
});

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    const ext = req.file.mimetype.split('/')[1];
    req.file.filename = `${uuid.v4()}.${ext}`;

    const photo = await jimp.read(req.file.buffer);
    await photo.resize(500, 500);
    await photo.write(`public/img/users/${req.file.filename}`);

    next();
});
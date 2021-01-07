const User = require('../models/User');
const { Store } = require('../models/Store');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.sendUserId = (req, res, next) => {
    if (!req.body.author) req.body.author = req.user.id;

    next();
};

exports.getAllStores = factory.getAll(Store);
exports.getStore = factory.getOne(Store, 'reviews');
exports.createStore = factory.createOne(Store);
exports.updateStore = factory.updateOne(Store);
exports.deleteStore = factory.deleteOne(Store);

exports.getAllTags = catchAsync(async (req, res, next) => {
    const tags = await Store.getTagsList();
    
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: tags.length,
        data: {
            tags
        }
    });
});

exports.getTopStores = catchAsync(async (req, res, next) => {
    const stores = await Store.getTopStores();

    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: stores.length,
        data: {
            stores
        }
    });
});

exports.heartStore = catchAsync(async (req, res, next) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';

    const user = await User.findByIdAndUpdate(req.user.id, 
        { [operator]: { hearts: req.params.id } }, 
        { new: true }
    );

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.getHearts = catchAsync(async (req, res, next) => {
    const stores = await Store.find({ _id: { $in: req.user.hearts } });

    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: stores.length,
        data: {
            stores
        }
    });
});

exports.searchStores = catchAsync(async (req, res, next) => {
    const stores = await Store
        .find({
            $text: { $search: req.query.q }
        }, {
            score : { $meta: 'textScore' }
        })
        .sort({
            score: { $meta: 'textScore' }
        })
        .limit(5);
    
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: stores.length,
        data: {
            stores
        }
    });
});

exports.mapStores = catchAsync(async (req, res, next) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 10000
            }
        }
    };

    const stores = await Store
        .find(q)
        .select('slug name description location photo')
        .limit(10);

        res.status(200).json({
            status: 'success',
            results: stores.length,
            data: {
                stores
            }
        });
});

exports.getStoreWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [ lat, lng ] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;


    if (!lat || !lng) {
        return next(new AppError('Please provide latitude and longitude in the format lat, lng', 400));
    }

    const stores = await Store.find(
        {
            location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
        }
    );

    res.status(200).json({
        status: 'success',
        results: stores.length,
        data: {
            stores
        }
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat ||!lng) {
        return next(new AppError('Please provide latitude and longitude in the format lat, lng', 400));
    }

    const distances = await Store.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            distances
        }
    });
});

exports.getStoreStats = catchAsync(async (req, res, next) => {
    const stats = await Store.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: '$author',
                numStore: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' }
            }
        },
        {
            $sort: { avgRating: 1 }
        }
    ]);

    res.status(200).json({
        status: 'success',
        results: stats.length,
        data: {
            stats
        }
    });
});
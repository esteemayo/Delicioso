const { Review } = require('../models/Review');
const factory = require('./handlerFactory');

exports.sendStoreAuthorIds = (req, res, next) => {
    if (!req.body.store) req.body.store = req.params.storeId;
    if (!req.body.author) req.body.author = req.user.id;

    next();
}

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
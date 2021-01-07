const Joi = require('joi');
const mongoose = require('mongoose');
const { Store } = require('./Store');

const reviewSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Your review must have text.']
    },
    rating: {
        type: Number,
        min: [1, 'Rating must not be below 1.0'],
        max: [5, 'Rating must not be above 5.0']
    },
    store: {
        type: mongoose.Types.ObjectId,
        ref: 'Store',
        required: [true, 'You must supply a store.']
    },
    author: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'You must supply an author.']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Preventing duplicate review
reviewSchema.index({ store: 1, author: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'author',
        select: 'name email photo'
    });

    next();
});

reviewSchema.statics.calcAverageRatings = async function(storeId) {
    const stats = await this.aggregate([
        {
            $match: { store: storeId }
        },
        {
            $group: {
                _id: '$store',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    // Persist the data(nRating and avgRating) into storeSchema or store in general
    if (stats.length > 0) {
        await Store.findByIdAndUpdate(storeId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Store.findByIdAndUpdate(storeId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
}

reviewSchema.post('save', function () {
    // this points to current review
    this.constructor.calcAverageRatings(this.store);
});

// Updating and deleting review|rating
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.rev = await this.findOne();

    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    await this.rev.constructor.calcAverageRatings(this.rev.store);
});

function validateReview(review) {
    const schema = Joi.object({
        text: Joi.string().required().label('Text'),
        rating: Joi.number().min(1).max(5).required().label('Rating'),
        store: Joi.objectId().label('Store'),
        author: Joi.objectId().label('Author')
    });

    return schema.validate(review);
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = {
    Review,
    validateReview
};
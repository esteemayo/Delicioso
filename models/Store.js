const mongoose = require('mongoose');
const slugify = require('slugify');
const Joi = require('joi');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'Please enter a store name.'],
        maxlength: [50, 'A store name must have less or equal than 50 characters.'],
        minlength: [10, 'A store name must have more or equal than 10 characters.']
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: {
        type: Array,
        validate: {
            validator: function(val) {
                return val && val.length > 0;
            },
            message: 'A store should have atleast one tag.'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0.'],
        max: [5, 'Rating must be below 5.0.'],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    photo: {
        type: String,
        default: 'store.png'
    },
    location: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [{
            type: Number,
            required: [true, 'You must supply coordinates.']
        }],
        address: {
            type: String,
            required: [true, 'You must supply an address.']
        }
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

storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({ name: 1, description: 1 });

storeSchema.index({ location: '2dsphere' });

storeSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'store'
});

storeSchema.pre('save', async function (next) {
    if (!this.isModified('name')) return next();

    this.slug = slugify(this.name, { lower: true });

    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storeWithSlug = await this.constructor.find({ slug: slugRegEx });

    if (storeWithSlug.length) {
        this.slug = `${this.slug}-${storeWithSlug.length + 1}`;
    }

    next();
});

storeSchema.pre(/^find/, function (next) {
    this.populate('reviews');

    next();
});

storeSchema.statics.getTagsList = function () {
    return this.aggregate([
        {
            $unwind: '$tags'
        },
        {
            $group: {
                _id: '$tags',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
}

storeSchema.statics.getTopStores = function () {
    return this.aggregate([
        {
            $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'store',
                as: 'reviews'
            }
        },
        {
            $match: { 'reviews.1': { $exists: true } }
        },
        {
            $addFields: {
                // name: '$$ROOT.name',
                // review: '$$ROOT.review',
                // slug: '$$ROOT.slug',
                // photo: '$$ROOT.photo',
                averageRatings: { $avg: '$reviews.rating' }
            }
        },
        {
            $sort: { averageRatings: -1 }
        },
        {
            $limit: 10
        }
    ]);
}

const Store = mongoose.model('Store', storeSchema);

function validateStore(store) {
    const schema = Joi.object({
        name: Joi.string().trim().required().max(50).min(10).label('Name'),
        description: Joi.string().trim().label('Description'),
        tags: Joi.array().required().label('Tags'),
        location: Joi.object().required().label('Location'),
        author: Joi.objectId().label('Author')
    });

    return schema.validate(store);
}

module.exports = {
    Store,
    validateStore
};
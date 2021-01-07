const crypto = require('crypto');
const User = require('../models/User');
const { Store } = require('../models/Store');
const { Review } = require('../models/Review');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getStores = catchAsync(async (req, res, next) => {
    const page = req.params.page * 1 || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    // const skip = (page * limit) - limit;

    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort('-createdAt');

    const countPromise = Store.countDocuments();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    const pages = Math.ceil(count / limit);

    if (!stores.length && skip) {
        req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
        return res.redirect(`/stores/page/${pages}`);
    }

    res.status(200).render('stores', {
        title: 'Stores',
        stores,
        count,
        pages,
        page
    });
});

exports.getStoreBySlug = catchAsync(async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug });

    if (!store) {
        return next(new AppError('No store found with that name!', 404));
    }
    
    res.render('store', {
        title: store.name,
        store
    });
});

exports.getStoresByTag = catchAsync(async (req, res, next) => {
    const { tag } = req.params;
    const tagQuery = tag || { $exists: true };
    
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery });
    
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    
    res.status(200).render('tag', {
        title: 'Tags',
        stores,
        tags,
        tag
    });
});

exports.getTopStores = catchAsync(async (req, res, next) => {
    const stores = await Store.getTopStores();
    
    res.status(200).render('topStores', {
        title: '⭐ Top Stores!',
        stores
    });
});

exports.createStore = catchAsync(async (req, res, next) => {
    if (req.file) req.body.photo = req.file.filename;
    if (!req.body.author) req.body.author = req.user.id;
    
    const store = await Store.create(req.body);
    
    req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
});

const confirmOwner = (store, user) => {
    if (!store.author.equals(user.id)) {
        throw Error('You must own a store in order to edit it!');
    }
}

exports.editStore = catchAsync(async (req, res, next) => {
    if (!res.locals.user) return res.status(401).redirect('back');

    const store = await Store.findOne({ _id: req.params.id });

    if (!store) {
        return next(new AppError('No store found with that name!', 404));
    }

    confirmOwner(store, res.locals.user);

    res.status(200).render('editStore', {
        title: `Edit ${store.name}`,
        store
    });
});

exports.updateStore = catchAsync(async (req, res, next) => {
    // Set the location data to be a point
    req.body.location.type = 'Point';
    if (req.file) req.body.photo = req.file.filename;

    const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href='/store/${store.slug}'>View Store →</a>`);
    res.redirect(`/stores/${store._id}/edit`);
});

exports.getHearts = catchAsync(async (req, res, next) => {
    const stores = await Store.find({ _id: { $in: req.user.hearts } });

    res.status(200).render('stores', {
        title: 'Hearted Stores 💖',
        stores
    });
});

exports.addReview = catchAsync(async (req, res, next) => {
    if (!req.body.store) req.body.store = req.params.id;
    if (!req.body.author) req.body.author = req.user.id;

    await Review.create(req.body);
    req.flash('success', 'Review Saved!');
    res.redirect('back');
});

exports.resetForm = catchAsync(async (req, res, next) => {
    // Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });

    // If token has not expired, and there is user, set the new password
    if (!user) {
        req.flash('error', 'Token is invalid or has expired.');
        return res.redirect('/forgot');
    }

    // Build and render template using the token
    res.status(200).render('reset', {
        title: 'Reset Your Password'
    });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });

    // If token has not expired, and there is user, set the new password
    if (!user) {
        req.flash('error', 'Token is invalid or has expired.');
        return res.redirect('/forgot');
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Update passwordChangedAt property for the user

    req.flash('success', '💃 Nice! Your password has been reset! You are now logged in!');
    // Redirect the user to log in route & send JWT
    res.redirect('/login');
});

exports.addStore = (req, res) => {
    if (!res.locals.user) {
        req.flash('error', `You are not logged in! Please <a href="/login">log in</a> to get access.`);
        return res.redirect('/');
    }

    res.status(200).render('editStore', {
        title: 'Add Store'
    });
}

exports.loginForm = (req, res) => {
    if (res.locals.user) return res.redirect('/');

    res.status(200).render('login', {
        title: 'Log into your account'
    });
}

exports.registerForm = (req, res) => {
    if (res.locals.user) return res.redirect('/');

    res.status(200).render('register', {
        title: 'Create your account!'
    });
}

exports.mapPage = (req, res) => {
    res.status(200).render('map', {
        title: 'Map 🌎'
    });
}

exports.forgotPassword = (req, res) => {
    if (res.locals.user) return res.redirect('/');

    res.status(200).render('forgot', {
        title: 'Forgot Password'
    })
}

exports.account = (req, res) => {
    if (!res.locals.user) {
        req.flash('error', `You are not logged in! Please <a href="/login">log in</a> to get access.`);
        return res.redirect('/');
    }

    res.status(200).render('account', {
        title: 'Account Settings'
    });
}
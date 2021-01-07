const express = require('express');
const authController = require('../controllers/authController');
const viewController = require('../controllers/viewController');
const imageController = require('../controllers/imageController');

const router = express.Router();

router.get('/', 
    authController.isLoggedIn,
    viewController.getStores
);

router.get('/stores', 
    authController.isLoggedIn, 
    viewController.getStores
);

router.get('/stores/page/:page', 
    authController.isLoggedIn,
    viewController.getStores
);

router.get('/store/:slug', 
    authController.isLoggedIn, 
    viewController.getStoreBySlug
);

router.get('/tags', 
    authController.isLoggedIn, 
    viewController.getStoresByTag
);

router.get('/tags/:tag', 
    authController.isLoggedIn, 
    viewController.getStoresByTag
);

router.get('/top', 
    authController.isLoggedIn, 
    viewController.getTopStores
);

router
    .route('/add')
    .get(
        authController.isLoggedIn,
        viewController.addStore
    )
    .post(
        authController.protect,
        imageController.uploadPhoto,
        imageController.resizeStorePhoto,
        viewController.createStore
    );

router.post('/add/:id', 
    imageController.uploadPhoto,
    imageController.resizeStorePhoto,
    viewController.updateStore
);

router.get('/stores/:id/edit', 
    authController.isLoggedIn,
    viewController.editStore
);

router.post('/stores/:id/reviews', 
    authController.protect,
    authController.restrictTo('user'),
    viewController.addReview
);

router.get('/login', 
    authController.isLoggedIn,
    viewController.loginForm
);

router.get('/register', 
    authController.isLoggedIn,
    viewController.registerForm
);

router.get('/hearts', 
    authController.protect,
    viewController.getHearts
);

router.get('/map', 
    authController.isLoggedIn,
    viewController.mapPage
);

router.get('/forgot', 
    authController.isLoggedIn,
    viewController.forgotPassword
);

router
    .route('/reset/:token')
    .get(viewController.resetForm)
    .post(viewController.resetPassword);

router.get('/account',
    authController.isLoggedIn,
    viewController.account
);

module.exports = router;
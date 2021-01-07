const express = require('express');
const authController = require('../controllers/authController');
const storeController = require('../controllers/storeController');
const imageController = require('../controllers/imageController');
const validateObjectId = require('../middlewares/validateObjectId');
const validate = require('../middlewares/validate');
const { validateStore } = require('../models/Store');
const reviewRouter = require('./reviews');

const router = express.Router();

router.use('/:storeId/reviews', reviewRouter);

router.get('/hearts', storeController.getHearts);

router.get('/search', storeController.searchStores);

router
    .route('/near')
    .get(storeController.mapStores);

router
    .route('/stores-within/:distance/center/:latlng/unit/:unit')
    .get(storeController.getStoreWithin);

router
    .route('/distances/:latlng/unit/:unit')
    .get(storeController.getDistances);

router
    .route('/store-stats')
    .get(storeController.getStoreStats);

router.use(authController.protect);

router.post('/:id/heart', storeController.heartStore);

router
    .route('/top-10-stores')
    .get(storeController.getTopStores);

router
    .route('/tags/:tag')
    .get(storeController.getAllTags);

router
    .route('/')
    .get(storeController.getAllStores)
    .post(
            validate(validateStore),
            imageController.uploadPhoto,
            imageController.resizeStorePhoto,
            storeController.sendUserId,
            storeController.createStore
        );
    
router
    .route('/:id')
    .get(
        validateObjectId, 
        storeController.getStore
    )
    .patch(
        validateObjectId,
        validate(validateStore),
        imageController.uploadPhoto,
        imageController.resizeStorePhoto,
        storeController.updateStore
    )
    .delete(
        validateObjectId,
        // authController.restrictTo('admin'), 
        storeController.deleteStore
    );

module.exports = router;
const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const validateObjectId = require('../middlewares/validateObjectId');
const validate = require('../middlewares/validate');
const { validateReview } = require('../models/Review');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        // authController.restrictTo('user'),
        validate(validateReview),
        reviewController.sendStoreAuthorIds,
        reviewController.createReview
    );

router
    .route('/:id')
    .get(
        validateObjectId,
        reviewController.getReview
    )
    .patch(
        validateObjectId,
        validate(validateReview),
        reviewController.updateReview
    )
    .delete(
        validateObjectId,
        reviewController.deleteReview
    );

module.exports = router;
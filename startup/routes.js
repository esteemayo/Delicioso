const express = require('express');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const flash = require('connect-flash');
const helpers = require('../helpers');

// Route
const AppError = require('../utils/appError');
const globalErrorHandler = require('../controllers/errorController');
const flashValidationErrors = require('../middlewares/flashValidationErrors');
const storeRouter = require('../routes/stores');
const userRouter = require('../routes/users');
const reviewRouter = require('../routes/reviews');
const viewRouter = require('../routes/views');

module.exports = app => {
    app.set('view engine', 'pug');
    app.set('views', path.join(`${__dirname}/../views`));

    // Global Middlewares
    // Implement CORS
    app.use(cors());

    // Access-Control-Allow-Origin
    app.options('*', cors());

    // Serving static files
    app.use(express.static(path.join(`${__dirname}/../public`)));

    // Set security HTTP headers
    app.use(helmet());

    // Development logging
    if (app.get('env') === 'development') {
        app.use(morgan('dev'));
    }

    // Limit request from same API
    const limiter = rateLimit({
        max: 100,
        windowMs: 60 * 60 * 1000,   // 1hr
        message: 'Too much requests from this IP. Please try again in an hour!'
    });

    app.use('/api/v1', limiter);

    // Body Parser, reading data from body into req.body
    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    // Cookie parser middleware
    app.use(cookieParser());

    app.use(session({
        secret: process.env.SECRET,
        key: process.env.KEY,
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({ mongooseConnection: mongoose.connection })
    }));

    // Connect flash
    app.use(flash());

    // Data sanitization against NoSQL query injection
    app.use(mongoSanitize());

    // Data sanitization against XSS
    app.use(xss());

    // Prevent parameter pollution
    app.use(hpp({
        whitelist: [
            'name',
            'rating',
            'ratingsAverage',
            'ratingsQuantity'
        ]
    }));

    // Compression middleware
    app.use(compression());

    // pass variables to our templates + all requests
    app.use((req, res, next) => {
        res.locals.h = helpers;
        res.locals.flashes = req.flash();
        res.locals.currentPath = req.originalUrl;

        next();
    });

    // Test middleware
    app.use((req, res, next) => {
        req.requestTime = new Date().toISOString();
        // console.log(req.headers);
        // console.log(req.cookies);

        next();
    });

    // Routes
    app.use('/', viewRouter);
    app.use('/api/v1/stores', storeRouter);
    app.use('/api/v1/users', userRouter);
    app.use('/api/v1/reviews', reviewRouter);

    app.all('*', (req, res, next) => {
        return next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
    });

    app.use(flashValidationErrors);

    app.use(globalErrorHandler);
}
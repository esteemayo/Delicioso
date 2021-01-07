const mongoose = require('mongoose');
const config = require('config');

// Db local
const db = config.get('db');

// Db atlas

module.exports = () => {
    // MongoDB connection
    mongoose.connect(db, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })
        .then(() => console.log(`Connected to MongoDB → ${db}`));
}
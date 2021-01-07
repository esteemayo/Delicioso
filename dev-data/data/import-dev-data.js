const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

// Models
const Store = require('../../models/Store');
const Review = require('../../models/Review');
const User = require('../../models/User');

dotenv.config({ path: './config.env' });

// Db local
const db = process.env.DATABASE_LOCAL;

// Db atlas

// MongoDB connection
mongoose.connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
    .then(() => console.log(`Connected to MongoDB → ${db}`));

// Read JSON file
const stores = JSON.parse(fs.readFileSync(`${__dirname}/stores.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

// Import data into DB
const importData = async () => {
    try {
        await Store.create(stores);
        await Review.create(reviews);
        await User.create(users, { validateBeforeSave: false });

        console.log('Data successfully loaded!💯✌');
        process.exit();
    } catch (err) {
        console.log(err);
        process.exit();
    }
};

// Delete all data from DB
const deleteData = async () => {
    try {
        await Store.deleteMany();
        await Review.deleteMany();
        await User.deleteMany();

        console.log('Data successfully deleted! 😭😂😭');
        process.exit();
    } catch (err) {
        console.log(err);
        process.exit();
    }
};

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('config');
const dotenv = require('dotenv');
const User = require('../../../models/User');

dotenv.config({ path: './config.env' });

describe('The User Model', () => {
    beforeEach(async () => {
        await mongoose.connect(config.get('db'), {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        });
    });

    afterEach(async () => {
        await User.deleteMany();
        await mongoose.connection.close();
    });

    it('should hash the user password before saving to the database', async () => {
        const user = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'test1234',
            passwordConfirm: 'test1234'
        };

        const createdUser = await User.create(user);

        expect(await bcrypt.compare(user.password, createdUser.password)).toBe(true);
    });

    it('should return a valid JWT', () => {
        const payload = {
            _id: new mongoose.Types.ObjectId().toHexString()
        };

        const user = new User(payload);
        const token = user.generateAuthToken();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        expect(decoded.id).toEqual(payload._id)
        expect(decoded).toHaveProperty('id', payload._id);
        expect(decoded).toHaveProperty('iat');
        expect(decoded).toHaveProperty('exp');
    });
});
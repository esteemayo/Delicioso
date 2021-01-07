const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const { Review } = require('../../models/Review');

describe('/api/v1/reviews', () => {
    let server,
    token,
    review,
    storeId,
    userId,
    id;
    
    beforeEach(async () => {
        server = require('../../server');

        storeId = mongoose.Types.ObjectId();
        userId = mongoose.Types.ObjectId();

        await User.create({
            _id: userId,
            name: 'Test User',
            email: 'someone@example.com',
            password: 'pass1234',
            passwordConfirm: 'pass1234',
        });

        review = await Review.create({
            text: 'Testing review',
            rating: 5,
            store: storeId,
            author: userId
        });

        token = new User().generateAuthToken();
        id = review._id;
    });

    afterEach(async () => {
        await server.close();
        await User.deleteMany();
        await Review.deleteMany();
    });

    describe('GET /', () => {
        const exec = async () => {
            return await request(server)
                .get('/api/v1/reviews')
                .set('Authorization', `Bearer ${token}`);
        }

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return all reviews', async () => {
            const reviews = [
                {
                    text: 'Testing review 1',
                    rating: 5,
                    store: storeId,
                    author: mongoose.Types.ObjectId()
                },
                {
                    text: 'Testing review 2',
                    rating: 4,
                    store: storeId,
                    author: mongoose.Types.ObjectId()
                }
            ];

            await Review.collection.insertMany(reviews);

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data.docs.length).toBe(3);
            expect(res.body.data.docs.some(r => r.text === 'Testing review 1')).toBeTruthy();
            expect(res.body.data.docs.some(r => r.text === 'Testing review 2')).toBeTruthy();
            expect(res.body.data.docs.some(r => r.rating === 5)).toBeTruthy();
            expect(res.body.data.docs.some(r => r.rating === 4)).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        const exec = async () => {
            return await request(server)
                .get(`/api/v1/reviews/${id}`)
                .set('Authorization', `Bearer ${token}`);
        }

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if no review was found with the given id', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return the review if valid id is passed', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data.doc).toHaveProperty('_id');
            expect(res.body.data.doc).toHaveProperty('text', review.text);
            expect(res.body.data.doc).toHaveProperty('rating', review.rating);
            expect(res.body.data.doc).toHaveProperty('store', review.store.toHexString());
            expect(Object.keys(res.body.data.doc.author)).toEqual(
                expect.arrayContaining(['_id', 'name', 'email', 'firstName', 'lastName'])
            );
        });
    });

    describe('POST /', () => {
        let text,
        rating,
        store,
        author;

        const exec = async () => {
            return await request(server)
                .post('/api/v1/reviews')
                .set('Authorization', `Bearer ${token}`)
                .send({ text, rating, store, author });
        }

        beforeEach(() => {
            text = 'My review';
            rating = 5;
            store = storeId;
            author = userId;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if review text is empty', async () => {
            text = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if rating is less than 1', async () => {
            rating = 0;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if rating is more than 5', async () => {
            rating = 6;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if there is no store', async () => {
            store = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if there is no author', async () => {
            author = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should save the review if it is valid', async () => {
            await exec();

            const review = await Review.find({ store: storeId });

            expect(review).not.toBeNull();
        });

        it('should return the review if it is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(201);
            expect(res.body.data.doc).toHaveProperty('_id');
            expect(res.body.data.doc).toHaveProperty('text', review);
            expect(res.body.data.doc).toHaveProperty('rating', rating);
            expect(res.body.data.doc).toHaveProperty('store', storeId.toHexString());
            expect(Object.keys(res.body.data.doc.author)).toEqual(
                expect.arrayContaining(['_id', 'name', 'email', 'firstName', 'lastName'])
            );
        });
    });

    describe('PATCH /:id', () => {
        let newText,
        newRating,
        newStore,
        newAuthor;

        const exec = async () => {
            return request(server)
                .patch(`/api/v1/reviews/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ text: newText, rating: newRating, store: newStore, author: newAuthor });
        }

        beforeEach(() => {
            newText = 'Updated review';
            newRating = 3;
            newStore = storeId;
            newAuthor = mongoose.Types.ObjectId();
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if no review was found with the given id', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 400 if review text is empty', async () => {
            newText = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if rating is less than 1', async () => {
            newRating = 0;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if rating is greater than 5', async () => {
            newRating = 6;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if no store is provided', async () => {
            newStore = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if there is no author', async () => {
            newAuthor = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should update the review if input is valid', async () => {
            await exec();

            const reviewInDb = await Review.findById(id);

            expect(reviewInDb.text).toBe(newText);
            expect(reviewInDb.rating).toBe(newRating);
            expect(reviewInDb.store).toBeDefined();
            expect(reviewInDb.author).toBeDefined();
        });

        it('should return the updated review', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data.doc).toHaveProperty('_id');
            expect(res.body.data.doc).toHaveProperty('text', newText);
            expect(res.body.data.doc).toHaveProperty('rating', newRating);
            expect(res.body.data.doc).toHaveProperty('store', newStore.toHexString());
        });
    });

    describe('DELETE /:id', () => {
        const exec = async () => {
            return await request(server)
                .delete(`/api/v1/reviews/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send();
        }

        it('should return 401 if client is not logged in', async () => {
            token = '';
    
            const res = await exec();
    
            expect(res.status).toBe(401);
        });
    
        it('should return 404 if id is invalid', async () => {
            id = 1;
    
            const res = await exec();
    
            expect(res.status).toBe(404);
        });
    
        it('should return 404 if no review was found with the given id', async () => {
            id = mongoose.Types.ObjectId();
    
            const res = await exec();
    
            expect(res.status).toBe(404);
        });
    
        it('should delete the review if valid id is passed', async () => {
            await exec();
    
            const reviewInDb = await Review.findById(id);
    
            expect(reviewInDb).toBeNull();
        });
    
        it('should return 204 if the review was deleted successfully', async () => {
            const res = await exec();
    
            expect(res.status).toBe(204);
        });
    });
});
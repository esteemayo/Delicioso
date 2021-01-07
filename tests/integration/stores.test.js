const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const { Store } = require('../../models/Store');

let server;

describe('/api/v1/stores', () => {
    let token;

    beforeEach(() => {
        server = require('../../server');

        token = new User().generateAuthToken();
    });

    afterEach(async () => {
        await server.close();
        await Store.deleteMany();
    });

    describe('GET /', () => {
        const exec = async () => {
            return await request(server)
                .get('/api/v1/stores')
                .set('Authorization', `Bearer ${token}`);
        };

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec()

            expect(res.status).toBe(401);
        });

        it('should return all stores', async () => {
            const stores = [
                { name: 'A new store 1', description: 'store description 1' },
                { name: 'A new store 2', description: 'store description 2' }
            ];

            await Store.collection.insertMany(stores);

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data.docs.length).toBe(2);
            expect(res.body.data.docs.some(s => s.name === 'A new store 1')).toBeTruthy();
            expect(res.body.data.docs.some(s => s.name === 'A new store 2')).toBeTruthy();
            expect(res.body.data.docs.some(s => s.description === 'store description 1')).toBeTruthy();
            expect(res.body.data.docs.some(s => s.description === 'store description 2')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        let store,
        id;
        
        const exec = async () => {
            return await request(server)
                .get(`/api/v1/stores/${id}`)
                .set('Authorization', `Bearer ${token}`);
        }

        beforeEach(async () => {
            store = await Store.create({
                name: 'A new store',
                description: 'Store description',
                location: {
                    address: 'North Carolina, United State',
                    coordinates: [
                        -79.86640360000001,
                        43.2624108
                    ]
                },
                author: mongoose.Types.ObjectId()
            });

            id = store._id;
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

        it('should return 404 if store with the given id was not found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return the store if it is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data.doc).toHaveProperty('_id', store._id.toHexString());
            expect(res.body.data.doc).toHaveProperty('name', store.name);
            expect(res.body.data.doc).toHaveProperty('description', store.description);
            expect(res.body.data.doc).toHaveProperty('author', store.author.toHexString());
        });
    });

    describe('POST /', () => {
        let name,
        description,
        location,
        author;

        const exec = async () => {
            return await request(server)
                .post('/api/v1/stores')
                .set('Authorization', `Bearer ${token}`)
                .send({ name, description, location, author });
        }

        beforeEach(() => {
            name = 'A new store';
            description = 'Store description';
            location = {
                address: 'North Carolina, United State',
                coordinates: [
                    -79.86640360000001,
                    43.2624108
                ]
            };
            author = mongoose.Types.ObjectId();
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if store name is not provided', async () => {
            name = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if store name is less than 10 characters', async () => {
            name = new Array(9).join('a');

            const res = await exec();
            
            expect(res.status).toBe(400);
        });

        it('should return 400 if store name is more than 50 characters', async () => {
            name = new Array(53).join('a');

            const res = await exec();
            
            expect(res.status).toBe(400);
        });

        it('should return 400 if store coordinates is not provided', async () => {
            location.coordinates = '';

            const res = await exec();
            
            expect(res.status).toBe(400);
        });

        it('should return 400 if store address is not provided', async () => {
            location.address = '';

            const res = await exec();
            
            expect(res.status).toBe(400);
        });

        it('should save the store if it is valid', async () => {
            await exec();

            const store = await Store.find({ name: 'A new store' });

            expect(store).not.toBeNull();
        });

        it('should return the store if it is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(201);
            expect(res.body.data.doc).toHaveProperty('_id');
            expect(res.body.data.doc).toHaveProperty('name', 'A new store');
            expect(res.body.data.doc).toHaveProperty('description', 'Store description');
            expect(res.body.data.doc).toHaveProperty('slug', 'a-very-new-store');
            expect(res.body.data.doc.location.coordinates).toEqual(
                expect.arrayContaining(location.coordinates)
            );
            expect(Object.keys(res.body.data.doc)).toEqual(
                expect.arrayContaining(
                    [
                        'id', 'name', 'description', 'slug',
                        'ratingsAverage', 'ratingsQuantity', 
                        'photo', 'author', 'location'
                    ]
                )
            );
        });
    });

    describe('PATCH /:id', () => {
        let store,
        newName,
        newDescription,
        newLocation,
        newAuthor,
        id;

        const exec = async () => {
            return await request(server)
                .patch(`/api/v1/stores/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: newName, description: newDescription, location: newLocation, author: newAuthor });
        }

        beforeEach(async () => {
            store = await Store.create({
                name: 'A new store',
                description: 'Store description',
                location: {
                    address: 'North Carolina, United State',
                    coordinates: [
                        -79.86640360000001,
                        43.2624108
                    ]
                },
                author: mongoose.Types.ObjectId()
            });

            newName = 'An updated store';
            newDescription = 'Lorem ipsum dolor';
            newLocation = {
                type: 'Point',
                address: 'Work Restaurant, James Street North, Hamilton, ON, Canada',
                coordinates: [
                    -79.86569700000001,
                    43.2649159
                ]
            };
            newAuthor = mongoose.Types.ObjectId();
            id = store._id;
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

        it('should return 404 if no store was found with the given id', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });
        
        it('should return 400 if store name is not provided', async () => {
            newName = '';

            const res = await exec();
            
            expect(res.status).toBe(400);
        });

        it('should return 400 if store name is less than 10 characters', async () => {
            newName = new Array(10).join('a');

            const res = await exec();
            
            expect(res.status).toBe(400);
        });

        it('should return 400 if store name is more than 50 characters', async () => {
            newName = new Array(53).join('a');

            const res = await exec();
            
            expect(res.status).toBe(400);
        });

        it('should return 400 if store coordinates is not provided', async () => {
            newLocation.coordinates = '';

            const res = await exec();
            
            expect(res.status).toBe(400);
        });

        it('should return 400 if store address is not provided', async () => {
            newLocation.address = '';

            const res = await exec();
            
            expect(res.status).toBe(400);
        });

        it('should update the store if input is valid', async () => {
            const res = await exec();

            const updatedStore = await Store.findById(id);

            expect(res.status).toBe(200);
            expect(updatedStore).toBeTruthy();
        });

        it('should return the store if input is valid', async () => {
            const res = await exec();

            expect(res.body.data.doc).toHaveProperty('_id');
            expect(res.body.data.doc).toHaveProperty('name', newName);
            expect(res.body.data.doc).toHaveProperty('description', newDescription);
            expect(res.body.data.doc).toHaveProperty('author', newAuthor.toHexString());
            expect(res.body.data.doc).toHaveProperty('location', newLocation);
        });
    });

    describe('DELETE /:id', () => {
        let store,
        id;

        const exec = async () => {
            return await request(server)
                .delete(`/api/v1/stores/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send();
        }

        beforeEach(async () => {
            store = await Store.create({
                name: 'A new store',
                description: 'Store description',
                location: {
                    address: 'North Carolina, United State',
                    coordinates: [
                        -79.86640360000001,
                        43.2624108
                    ]
                },
                author: mongoose.Types.ObjectId()
            });

            id = store._id;
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

        it('should return 404 if no store was found with the given id', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should delete the store if id is valid', async () => {
            await exec();

            const storeInDb = await Store.findById(id);

            expect(storeInDb).toBeNull();
        });

        it('should return 204 if store was successfully deleted', async () => {
            const res = await exec();

            expect(res.status).toBe(204);
        });
    });
});
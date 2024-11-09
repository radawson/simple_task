const request = require('supertest');
const { beforeAll, beforeEach, afterAll, describe, it, expect } = require('@jest/globals');
const { Server } = require('../core/Server');
const { User } = require('../models');
const config = require('../config');
const Logger = require('../core/Logger');

describe('Auth Endpoints', () => {
    let server;
    let app;

    beforeAll(async () => {
        // Initialize test server
        server = new Server(config);
        await server.initialize();
        app = server.app;
    });

    beforeEach(async () => {
        // Clear users before each test
        await User.destroy({ where: {}, force: true });
    });

    afterAll(async () => {
        await server.stop();
    });

    describe('POST /auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: 'testuser',
                    password: 'Test123!',
                    email: 'test@example.com'
                });
            
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('userId');
        });

        it('should fail with invalid data', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: 'test',
                    password: '123'
                });
            
            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            // Create test user
            await request(app)
                .post('/auth/register')
                .send({
                    username: 'testuser',
                    password: 'Test123!',
                    email: 'test@example.com'
                });
        });

        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Test123!'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail with invalid credentials', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpass'
                });

            expect(res.statusCode).toBe(401);
        });
    });
});
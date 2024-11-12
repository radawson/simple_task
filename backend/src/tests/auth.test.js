// src/tests/auth.test.js
import { jest } from '@jest/globals';
import request from 'supertest';
import { Server } from '../core/Server.js';
import { User, Session } from '../models/index.js';
import config from '../config/index.js';
import models from '../models/index.js';
import authController from '../controllers/auth.controller.js';
import { Sequelize } from 'sequelize';


describe('Auth Endpoints', () => {
    let server;
    let app;
    let sequelize;
    let User;
    let Session;

    beforeAll(async () => {
        // Setup test database
        sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: ':memory:',
            logging: false
        });

        User = models.User;
        Session = models.Session;

        // Initialize models with test database
        Object.values(models).forEach(model => {
            if (model.init) {
                model.init(sequelize);
            }
        });

        // Set up associations
        Object.values(models).forEach(model => {
            if (model.associate) {
                model.associate(models);
            }
        });

        // Sync database
        await sequelize.sync({ force: true });

        // Initialize server
        server = new Server(config);
        await server.initialize();
        app = server.app;
    });

    beforeEach(async () => {
        await User.destroy({ where: {}, force: true });
        await Session.destroy({ where: {}, force: true });
    });

    afterAll(async () => {
        // Clear interval from AuthController
        clearInterval(authController.cleanupInterval);

        if (server?.stop) {
            await server.stop();
        }
        await sequelize.close();
    });

    describe('POST /auth/register', () => {
        const validUser = {
            username: 'testuser',
            password: 'Test123!',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User'
        };

        it('should register valid user', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send(validUser);
            
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('userId');
        });

        it('should reject duplicate username', async () => {
            await request(app).post('/auth/register').send(validUser);
            const res = await request(app).post('/auth/register').send(validUser);
            
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('already exists');
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: 'testuser',
                    password: 'Test123!',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User'
                });
            testUser = res.body;
        });

        it('should login valid user', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Test123!'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            
            accessToken = res.body.accessToken;
            refreshToken = res.body.refreshToken;
        });

        it('should create session on login', async () => {
            await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Test123!'
                });

            const sessions = await Session.findAll();
            expect(sessions.length).toBe(1);
            expect(sessions[0].isValid).toBe(true);
        });
    });

    describe('POST /auth/refresh', () => {
        let refreshToken;
        let testUser;
        
        beforeEach(async () => {
            // Create test user
            const registerRes = await request(app)
                .post('/auth/register')
                .send({
                    username: 'testuser',
                    password: 'Test123!',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User'
                });
    
            testUser = registerRes.body;
            
            // Login to get tokens
            const loginRes = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Test123!'
                });
                
            refreshToken = loginRes.body.refreshToken;
            
            // Ensure session is saved
            await new Promise(resolve => setTimeout(resolve, 500));
        });
    
        it('should reject request with wrong content type', async () => {
            const res = await request(app)
                .post('/auth/refresh')
                .set('Content-Type', 'text/plain')
                .send(refreshToken);
    
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Content-Type must be application/json');
        });
    
        it('should reject request without refresh token', async () => {
            const res = await request(app)
                .post('/auth/refresh')
                .send({});
    
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('refresh_token is required');
        });
    
        it('should reject invalid refresh token', async () => {
            const res = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken: 'invalid-token' });
    
            expect(res.statusCode).toBe(401);
            expect(res.body.message).toContain('Invalid refresh token');
        });
    
        it('should refresh token with valid request', async () => {
            const res = await request(app)
                .post('/auth/refresh')
                .set('Content-Type', 'application/json')
                .send({ refreshToken });
    
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.refreshToken).not.toBe(refreshToken);
        });
    
        it('should reject expired refresh token', async () => {
            // Update session to be expired
            await Session.update(
                { expiresAt: new Date(Date.now() - 1000) },
                { where: { refreshToken } }
            );
    
            const res = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken });
    
            expect(res.statusCode).toBe(401);
            expect(res.body.message).toContain('Invalid refresh token');
        });
    });

    describe('POST /auth/logout', () => {
        let accessToken;
    
        beforeEach(async () => {
            // Register and login to get fresh token
            await request(app)
                .post('/auth/register')
                .send({
                    username: 'testuser',
                    password: 'Test123!',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User'
                });
    
            const loginRes = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Test123!'
                });
            accessToken = loginRes.body.accessToken;
        });
    
        it('should invalidate session', async () => {
            const res = await request(app)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`);
    
            expect(res.statusCode).toBe(200);
            
            const sessions = await Session.findAll({ 
                where: { isValid: true }
            });
            expect(sessions.length).toBe(0);
        });
    });
});
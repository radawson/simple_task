// Initialize logger first
const Logger = require('../core/Logger');
new Logger({
    level: 'error',
    directory: 'logs/test',
    maxFiles: '1d',
    format: 'simple'
});

const request = require('supertest');
const { beforeAll, beforeEach, afterAll, describe, it, expect } = require('@jest/globals');
const { Server } = require('../core');
const { User } = require('../models');

// Test configuration
const testConfig = {
    port: 9179,
    sslPort: 9180,
    sslKey: "certs/cert.key",
    sslCert: "certs/cert.crt",
    cors: {
        origins: ["http://localhost:3000"],
        credentials: true
    },
    logger: {
        level: 'error',
        directory: 'logs/test',
        maxFiles: '1d'
    },
    security: {
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'"]
                }
            }
        },
        rateLimiting: {
            windowMs: 900000,
            max: 100
        }
    }
};

describe('Auth Endpoints', () => {
    let server;
    let app;

    beforeAll(async () => {
        try {
            server = new Server(testConfig);
            await server.initialize();
            app = server.app;
            
            // Create test database tables
            await User.sync({ force: true });
            
            console.log('Test environment ready');
        } catch (error) {
            console.error('Setup failed:', error);
            throw error;
        }
    });

    beforeEach(async () => {
        await User.destroy({ 
            where: {}, 
            force: true,
            truncate: true 
        });
    });

    afterAll(async () => {
        if (server?.stop) {
            await server.stop();
        }
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
//src/tests/cors.test.js
import { jest } from '@jest/globals';
import request from 'supertest';
import { Server } from '../core/Server.js';
import Logger from '../core/Logger.js';
import express from 'express';
import corsMiddleware from '../middleware/cors.middleware.js';

// Initialize logger for tests
new Logger({
    level: 'error',
    directory: 'logs/test',
    maxFiles: '1d',
    format: 'simple'
});

describe('CORS Middleware', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(corsMiddleware);
        // Add test route
        app.get('/test', (req, res) => res.json({ message: 'success' }));
    });

    it('should allow requests from localhost:3000', async () => {
        const res = await request(app)
            .get('/test')
            .set('Origin', 'http://localhost:3000');

        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
        expect(res.status).toBe(200);
    });

    it('should allow requests with no origin (like Postman)', async () => {
        const res = await request(app)
            .get('/test');

        expect(res.status).toBe(200);
    });

    it('should block requests from disallowed origins', async () => {
        const res = await request(app)
            .get('/test')
            .set('Origin', 'http://malicious-site.com');

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('CORS not allowed');
    });

    it('should handle OPTIONS preflight requests', async () => {
        const res = await request(app)
            .options('/test')
            .set('Origin', 'http://localhost:3000')
            .set('Access-Control-Request-Method', 'GET');

        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-methods'])
            .toContain('GET, POST, PUT, DELETE, OPTIONS');
    });

    it('should allow specified methods', async () => {
        const res = await request(app)
            .options('/test')
            .set('Origin', 'http://localhost:3000');

        const allowedMethods = res.headers['access-control-allow-methods'];
        expect(allowedMethods).toContain('GET');
        expect(allowedMethods).toContain('POST');
        expect(allowedMethods).toContain('PUT');
        expect(allowedMethods).toContain('DELETE');
        expect(allowedMethods).toContain('OPTIONS');
    });

    it('should allow specified headers', async () => {
        const res = await request(app)
            .options('/test')
            .set('Origin', 'http://localhost:3000');

        const allowedHeaders = res.headers['access-control-allow-headers'];
        expect(allowedHeaders).toContain('Content-Type');
        expect(allowedHeaders).toContain('Authorization');
    });

    it('should handle credentials', async () => {
        const res = await request(app)
            .options('/test')
            .set('Origin', 'http://localhost:3000');

        expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    // Test that logger is called
    it('should log request details', async () => {
        const mockDebug = jest.spyOn(Logger.getInstance(), 'debug');
        
        await request(app)
            .get('/test')
            .set('Origin', 'http://localhost:3000')
            .set('Authorization', 'Bearer token');

        expect(mockDebug).toHaveBeenCalled();
        expect(mockDebug.mock.calls[0][0]).toContain('GET /test');
        
        mockDebug.mockRestore();
    });

    it('should log CORS errors', async () => {
        const mockError = jest.spyOn(Logger.getInstance(), 'error');
        
        await request(app)
            .get('/test')
            .set('Origin', 'http://malicious-site.com');

        expect(mockError).toHaveBeenCalled();
        expect(mockError.mock.calls[0][0]).toBe('CORS Error:');
        
        mockError.mockRestore();
    });
});
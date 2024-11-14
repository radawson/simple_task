//src/tests/event.routes.test.js
import { jest } from '@jest/globals';
import request from 'supertest';
import { Server } from '../core/Server.js';
import { User, Session } from '../models/index.js';
import config from '../config/index.js';
import models from '../models/index.js';
import authController from '../controllers/auth.controller.js';
import { Sequelize } from 'sequelize';

describe('Event Routes', () => {
    let server, token;
    
    beforeAll(async () => {
        // Initialize logger first
        new Logger({ level: 'error', directory: './logs', maxFiles: '14d' });
        
        server = new Server(config.server);
        await server.initialize();
        
        // Create test user and get token
        const user = await User.create({
            username: 'testuser',
            password: 'password123',
            email: 'test@example.com'
        });
        
        const loginRes = await request(server.app)
            .post('/auth/login')
            .send({ username: 'testuser', password: 'password123' });
        token = loginRes.body.accessToken;
    });

    beforeEach(async () => {
        await Event.destroy({ where: {} });
    });

    afterAll(async () => {
        // Clean up server and database connections
        await server.close();
        if (server.db) {
            await server.db.close();
        }
    });

    describe('Public Routes', () => {
        it('should list events with pagination', async () => {
            await Event.bulkCreate([
                { name: 'Event 1', dateStart: new Date(), clock_time: '09:00' },
                { name: 'Event 2', dateStart: new Date(), clock_time: '10:00' }
            ]);

            const res = await request(server.app)
                .get('/api/events?page=1&limit=1');

            expect(res.statusCode).toBe(200);
            expect(res.body.events.length).toBe(1);
            expect(res.body.totalPages).toBe(2);
        });

        it('should get events by date range', async () => {
            const start = new Date();
            const end = new Date(start.getTime() + 86400000 * 2);
            
            await Event.bulkCreate([
                { name: 'Event 1', dateStart: start, clock_time: '09:00' },
                { name: 'Event 2', dateStart: end, clock_time: '10:00' },
                { name: 'Event 3', dateStart: new Date(end.getTime() + 86400000), clock_time: '11:00' }
            ]);

            const res = await request(server.app)
                .get(`/api/events/range/${start.toISOString()}/${end.toISOString()}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);
        });
    });

    describe('Protected Routes', () => {
        it('should create an event with authentication', async () => {
            const res = await request(server.app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'New Event',
                    dateStart: new Date(),
                    clock_time: '09:00',
                    description: 'Test Description'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe('New Event');
        });

        it('should update an event', async () => {
            const event = await Event.create({
                name: 'Original Event',
                dateStart: new Date(),
                clock_time: '09:00'
            });

            const res = await request(server.app)
                .put(`/api/events/${event.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Updated Event'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe('Updated Event');
        });

        describe('Calendar Operations', () => {
            const mockICalData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-event@example.com
SUMMARY:Test Event
DTSTART:20240101T090000Z
END:VEVENT
END:VCALENDAR`;

            it('should import iCal event', async () => {
                const res = await request(server.app)
                    .post('/api/events/import')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ icalData: mockICalData });

                expect(res.statusCode).toBe(201);
                expect(res.body.name).toBe('Test Event');
            });

            it('should export event as iCal', async () => {
                const event = await Event.create({
                    name: 'Export Test',
                    dateStart: new Date('2024-01-01T09:00:00Z'),
                    clock_time: '09:00',
                    uid: 'test-event@example.com'
                });

                const res = await request(server.app)
                    .get(`/api/events/export/${event.id}`)
                    .set('Authorization', `Bearer ${token}`);

                expect(res.statusCode).toBe(200);
                expect(res.header['content-type']).toBe('text/calendar');
                expect(res.text).toContain('BEGIN:VCALENDAR');
            });
        });
    });
});
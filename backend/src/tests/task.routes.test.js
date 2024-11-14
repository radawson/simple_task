const request = require('supertest');
const { Server } = require('../core');
const { Task } = require('../models');
const config = require('../config');

describe('Task Routes', () => {
    let server;
    
    beforeAll(async () => {
        server = new Server(config.server);
        await server.initialize();
    });

    beforeEach(async () => {
        await Task.destroy({ where: {} });
    });

    describe('GET /tasks', () => {
        it('should return tasks without authentication', async () => {
            const task = await Task.create({
                name: 'Test Task',
                description: 'Test Description',
                date: new Date()
            });

            const res = await request(server.app)
                .get('/api/tasks');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.tasks)).toBe(true);
            expect(res.body.tasks[0].id).toBe(task.id);
        });

        it('should filter tasks by date', async () => {
            const date = new Date();
            await Task.create({
                name: 'Task 1',
                date: date
            });
            await Task.create({
                name: 'Task 2',
                date: new Date(date.getTime() + 86400000)
            });

            const res = await request(server.app)
                .get(`/api/tasks/date/${date.toISOString().split('T')[0]}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe('Task 1');
        });
    });
});
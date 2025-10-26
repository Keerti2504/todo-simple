const request = require('supertest');
const app = require('../server');

describe('ToDo API', () => {
    let createdTodoId;

    // Test GET /api/todos initially empty
    test('GET /api/todos should return empty array', async () => {
        const res = await request(app).get('/api/todos');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });

    // Test POST /api/todos
    test('POST /api/todos should create a todo', async () => {
        const res = await request(app)
            .post('/api/todos')
            .send({ title: 'Learn Jest' });
        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe('Learn Jest');
        expect(res.body.id).toBeDefined();
        createdTodoId = res.body.id;
    });

    // Test GET /api/todos after adding one
    test('GET /api/todos should return array with one todo', async () => {
        const res = await request(app).get('/api/todos');
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe(createdTodoId);
    });

    // Test DELETE /api/todos/:id
    test('DELETE /api/todos/:id should remove the todo', async () => {
        const res = await request(app).delete(`/api/todos/${createdTodoId}`);
        expect(res.statusCode).toBe(204);
    });

    // Test GET /api/todos after deletion
    test('GET /api/todos should return empty array after deletion', async () => {
        const res = await request(app).get('/api/todos');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });
});

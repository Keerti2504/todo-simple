// test/todo.test.js
const request = require('supertest');
const app = require('../server'); // import your Express app

describe('Todo API', () => {
  let todoId;

  // Health check
  test('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  // Create a todo
  test('POST /api/todos creates a new todo', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Test todo' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test todo');
    expect(res.body.done).toBe(false);
    todoId = res.body.id; // save id for later tests
  });

  // Read all todos
  test('GET /api/todos returns todos', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Update a todo
  test('PUT /api/todos/:id updates a todo', async () => {
    const res = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({ done: true, title: 'Updated todo' });
    expect(res.statusCode).toBe(200);
    expect(res.body.done).toBe(true);
    expect(res.body.title).toBe('Updated todo');
  });

  // Delete a todo
  test('DELETE /api/todos/:id deletes a todo', async () => {
    const res = await request(app).delete(`/api/todos/${todoId}`);
    expect([204, 404]).toContain(res.statusCode); // 204 if deleted, 404 if not found
  });

  // Create todo without title should fail
  test('POST /api/todos without title returns 400', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('title required');
  });
});

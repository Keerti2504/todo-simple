const request = require('supertest');
const app = require('../server');

describe('Todo API', () => {
  let created;

  test('POST /api/todos should create', async () => {
    const res = await request(app).post('/api/todos').send({ title: 'test1' }).expect(201);
    expect(res.body).toHaveProperty('id');
    created = res.body;
  });

  test('GET /api/todos should return array', async () => {
    const res = await request(app).get('/api/todos').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('PUT /api/todos/:id should update', async () => {
    const res = await request(app).put(`/api/todos/${created.id}`).send({ done: true }).expect(200);
    expect(res.body.done).toBe(true);
  });

  test('DELETE /api/todos/:id should delete', async () => {
    await request(app).delete(`/api/todos/${created.id}`).expect(204);
  });
});

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('./server'); // adjust if your file is named differently

const USERS_FILE = path.join(__dirname, 'users.json');
const TODOS_FILE = path.join(__dirname, 'todos.json');

// Helper to clean files before each test
beforeEach(() => {
  if (fs.existsSync(USERS_FILE)) fs.unlinkSync(USERS_FILE);
  if (fs.existsSync(TODOS_FILE)) fs.unlinkSync(TODOS_FILE);
});

describe('Todo API Integration & Acceptance Tests', () => {
  let token = '';

  test('Signup works', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ username: 'alice', password: 'secret' });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('user created');
  });

  test('Login returns JWT token', async () => {
    await request(app)
      .post('/api/signup')
      .send({ username: 'bob', password: 'pass123' });

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'bob', password: 'pass123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test('CRUD Todo flow (Authenticated)', async () => {
    await request(app)
      .post('/api/signup')
      .send({ username: 'test', password: '1234' });

    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'test', password: '1234' });
    token = loginRes.body.token;

    // Create todo
    const createRes = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Todo', priority: 'high', dueDate: '2025-12-31' });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.title).toBe('Test Todo');
    expect(createRes.body.priority).toBe('high');

    const todoId = createRes.body.id;

    // Get todos
    const getRes = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.length).toBe(1);

    // Update todo
    const updateRes = await request(app)
      .put(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ done: true });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.done).toBe(true);

    // Delete todo
    const deleteRes = await request(app)
      .delete(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.statusCode).toBe(204);
  });
});

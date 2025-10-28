const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

// Clean slate before tests
const USERS_FILE = path.join(__dirname, '../users.json');
const TODOS_FILE = path.join(__dirname, '../todos.json');

beforeAll(() => {
  if (fs.existsSync(USERS_FILE)) fs.unlinkSync(USERS_FILE);
  if (fs.existsSync(TODOS_FILE)) fs.unlinkSync(TODOS_FILE);
});

describe('System Testing - Full App Flow', () => {
  let token;
  let todoId;

  test('User Signup', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ username: 'systemuser', password: '1234' });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('user created');
  });

  test('Login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'systemuser', password: '1234' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test('Access todos without token should fail', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.statusCode).toBe(401);
  });

  test('Create todo with token', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'End-to-End System Test', priority: 'high' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('End-to-End System Test');
    todoId = res.body.id;
  });

  test('Read todos with token', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].title).toBe('End-to-End System Test');
  });

  test('Update todo with token', async () => {
    const res = await request(app)
      .put(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ done: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.done).toBe(true);
  });

  test('Delete todo with token', async () => {
    const res = await request(app)
      .delete(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(204);
  });

  test('Check todos after deletion', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});

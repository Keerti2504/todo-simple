const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

const USERS_FILE = path.join(__dirname, '../users.json');
const TODOS_FILE = path.join(__dirname, '../todos.json');

beforeAll(() => {
  if (fs.existsSync(USERS_FILE)) fs.unlinkSync(USERS_FILE);
  if (fs.existsSync(TODOS_FILE)) fs.unlinkSync(TODOS_FILE);
});

describe('Regression Testing - Core CRUD under Auth', () => {
  let token;
  let todoId;

  test('1️⃣ Signup a user', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ username: 'regression', password: '1234' });
    expect(res.statusCode).toBe(201);
  });

  test('2️⃣ Login to get token', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'regression', password: '1234' });
    expect(res.statusCode).toBe(200);
    token = res.body.token;
    expect(token).toBeDefined();
  });

  test('3️⃣ Create Todo - same behavior as before', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Old Feature Works', priority: 'normal' });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Old Feature Works');
    todoId = res.body.id;
  });

  test('4️⃣ Get Todos - still returns array', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  test('5️⃣ Update Todo - basic field editing unchanged', async () => {
    const res = await request(app)
      .put(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Edited Feature', done: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Edited Feature');
    expect(res.body.done).toBe(true);
  });

  test('6️⃣ Delete Todo - still removes correctly', async () => {
    const res = await request(app)
      .delete(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(204);
  });

  test('7️⃣ Get Todos again - empty array after deletion', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});

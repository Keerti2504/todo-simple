const request = require('supertest');
const app = require('../server');

describe('ToDo API (with Auth)', () => {
  let token;
  let createdTodoId;

  // Sign up and log in once before all tests
  beforeAll(async () => {
    await request(app)
      .post('/api/signup')
      .send({ username: 'testuser', password: 'testpass' });

    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'testuser', password: 'testpass' });

    token = loginRes.body.token;
    expect(token).toBeDefined();
  });

  // Initially no todos
  test('GET /api/todos should return empty array', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Create a todo
  test('POST /api/todos should create a todo', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Learn Jest', priority: 'high' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Learn Jest');
    expect(res.body.id).toBeDefined();

    createdTodoId = res.body.id;
  });

  // Verify it was added
  test('GET /api/todos should return array with one todo', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(createdTodoId);
  });

  // Delete it
  test('DELETE /api/todos/:id should remove the todo', async () => {
    const res = await request(app)
      .delete(`/api/todos/${createdTodoId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(204);
  });

  // Should now be empty again
  test('GET /api/todos should return empty array after deletion', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});

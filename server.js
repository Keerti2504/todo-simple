const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const SECRET = 'supersecretkey';

// === File-based storage ===
const USERS_FILE = './users.json';
const TODOS_FILE = './todos.json';

let users = [];
let todos = [];

// === Load persisted data if files exist ===
try {
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    console.log(`✅ Loaded ${users.length} users`);
  }
} catch (e) {
    console.error('⚠️ Error loading users.json:', e);
}

try {
  if (fs.existsSync(TODOS_FILE)) {
    todos = JSON.parse(fs.readFileSync(TODOS_FILE, 'utf8'));
    console.log(`✅ Loaded ${todos.length} todos`);
  }
} catch (e) {
    console.error('⚠️ Error loading todos.json:', e);
}

// === Helper functions to save data ===
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function saveTodos() {
  fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2));
}

// === JWT Auth Middleware ===
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'token required' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'invalid token' });
  }
}

// === Signup ===
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'username & password required' });

  if (users.find(u => u.username === username))
    return res.status(409).json({ error: 'user already exists' });

  const hash = await bcrypt.hash(password, 10);
  users.push({ username, password: hash });
  saveUsers();
  res.status(201).json({ message: 'user created successfully' });
});

// === Login ===
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'invalid credentials' });

  const token = jwt.sign({ username }, SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// === Create Todo ===
app.post('/api/todos', auth, (req, res) => {
  const { title, priority = 'normal', dueDate } = req.body;

  if (!title) return res.status(400).json({ error: 'title required' });

  const validPriorities = ['low', 'normal', 'high'];
  if (!validPriorities.includes(priority))
    return res.status(400).json({ error: 'invalid priority' });

  if (dueDate && isNaN(Date.parse(dueDate)))
    return res.status(400).json({ error: 'invalid dueDate format' });

  const todo = {
    id: uuidv4(),
    title,
    priority,
    dueDate: dueDate || null,
    done: false,
    user: req.user.username,
    createdAt: new Date().toISOString()
  };

  todos.push(todo);
  saveTodos();
  res.status(201).json(todo);
});

// === Read Todos ===
app.get('/api/todos', auth, (req, res) => {
  const userTodos = todos.filter(t => t.user === req.user.username);
  res.json(userTodos);
});

// === Update Todo ===
app.put('/api/todos/:id', auth, (req, res) => {
  const todo = todos.find(
    t => t.id === req.params.id && t.user === req.user.username
  );
  if (!todo) return res.status(404).json({ error: 'todo not found' });

  todo.title = req.body.title ?? todo.title;
  if (typeof req.body.done === 'boolean') todo.done = req.body.done;
  if (req.body.priority) todo.priority = req.body.priority;
  if (req.body.dueDate && !isNaN(Date.parse(req.body.dueDate)))
    todo.dueDate = req.body.dueDate;

  saveTodos();
  res.json(todo);
});

// === Delete Todo ===
app.delete('/api/todos/:id', auth, (req, res) => {
  const before = todos.length;
  todos = todos.filter(
    t => !(t.id === req.params.id && t.user === req.user.username)
  );
  if (before !== todos.length) saveTodos();
  res.status(before === todos.length ? 404 : 204).end();
});

// === Health check ===
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// === Start server ===
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
}

module.exports = app;

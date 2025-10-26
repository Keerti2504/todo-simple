const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

let todos = [];

// Create
app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const todo = { id: uuidv4(), title, done: false, createdAt: new Date().toISOString() };
  todos.push(todo);
  res.status(201).json(todo);
});

// Read all
app.get('/api/todos', (req, res) => res.json(todos));

// Update
app.put('/api/todos/:id', (req, res) => {
  const t = todos.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'not found' });
  t.title = req.body.title ?? t.title;
  if (typeof req.body.done === 'boolean') t.done = req.body.done;
  res.json(t);
});

// Delete
app.delete('/api/todos/:id', (req, res) => {
  const before = todos.length;
  todos = todos.filter(x => x.id !== req.params.id);
  res.status(before === todos.length ? 404 : 204).end();
});

// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Server listening ${port}`));
}

module.exports = app; // for tests

const express = require('express');
const path = require('path');
const scan = require('./api/scan');
const compare = require('./api/compare');
const markDuplicates = require('./api/mark-duplicates');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/duplicado/:id', (req, res) => res.sendFile(path.join(__dirname, 'compare.html')));

app.post('/api/scan', scan);
app.post('/api/compare', compare);
app.post('/api/mark-duplicates', markDuplicates);

app.listen(port, () => console.log(`🚀 Server on http://localhost:${port}`));

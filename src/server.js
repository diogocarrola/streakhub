const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('./db');
const routes = require('./routes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
app.use(express.json());

// Allow CORS from your GitHub Pages domain
app.use(cors({
  origin: 'https://diogocarrola.github.io'
}));

app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
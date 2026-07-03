const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./config');

const app = express();
const port = process.env.PORT || 3000;

let pool = null;

async function initDb() {
  try {
    pool = mysql.createPool({ ...config.db, connectTimeout: 5000 });
    await pool.query('SELECT 1');
    console.log('Conexión a MySQL OK');
  } catch (err) {
    console.warn('MySQL no disponible; la app seguirá sirviendo la interfaz:', err.message);
    pool = null;
  }
}

initDb();

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/clientes', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'MySQL no disponible' });
  }

  try {
    const [results] = await pool.query('SELECT * FROM Cliente');
    res.json(results);
  } catch (err) {
    console.error('Error al consultar la base de datos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

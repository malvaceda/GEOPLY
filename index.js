const express = require('express');
const mysql = require('mysql2/promise');
const config = require('./config');

const app = express();
const port = 3000;

// Hacer conexión MySQL
const pool = mysql.createPool(config.db);

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Servir archivos estáticos como index.html desde una carpeta llamada "public"
app.use(express.static('public'));

// Endpoint para obtener datos
app.get('/clientes', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM Cliente');
        res.json(results); // Enviar los datos como JSON al navegador
    } catch (err) {
        console.error('Error al consultar la base de datos:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

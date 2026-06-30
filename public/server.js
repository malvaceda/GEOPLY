'use strict';

const express = require('express');
const mysql   = require('mysql2/promise');
const path    = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME     || 'geoply_empleo',
  waitForConnections: true,
  connectionLimit: 10,
});

app.get('/api/organizaciones', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre_organizacion, sector_economico, ciudad, sitio_web, verificada
       FROM Organizacion
       ORDER BY fecha_registro DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[GeoPly] /api/organizaciones:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.patch('/api/organizaciones/:id/verificar', async (req, res) => {
  try {
    await pool.query('UPDATE Organizacion SET verificada = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[GeoPly] /api/organizaciones/:id/verificar:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.post('/api/registro-aspirante', async (req, res) => {
  try {
    const {
      nombre, correo, telefono, municipio,
      nivel_educativo, experiencia_anios, area_interes,
      aspiracion_salarial, descripcion,
    } = req.body;

    if (!nombre || !correo) {
      return res.status(400).json({ error: 'Nombre y correo son obligatorios.' });
    }

    const [result] = await pool.query(
      `INSERT INTO Aspirante
         (nombre_completo, correo, telefono, municipio,
          nivel_educativo, profesion, experiencia_anios,
          aspiracion_salarial, habilidades)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre, correo, telefono || null, municipio || null,
        nivel_educativo || null, area_interes || null,
        parseInt(experiencia_anios) || 0,
        parseFloat(aspiracion_salarial) || 0,
        descripcion || null,
      ]
    );

    res.json({
      success: true,
      id:      result.insertId,
      message: 'Aspirante registrado correctamente.',
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un aspirante con ese correo.' });
    }
    console.error('[GeoPly] /api/registro-aspirante:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.put('/api/registro-aspirante/:id', async (req, res) => {
  try {
    const {
      nombre, correo, telefono, municipio,
      nivel_educativo, experiencia_anios, area_interes,
      aspiracion_salarial, descripcion,
    } = req.body;

    if (!nombre || !correo) {
      return res.status(400).json({ error: 'Nombre y correo son obligatorios.' });
    }

    await pool.query(
      `UPDATE Aspirante SET
         nombre_completo = ?, correo = ?, telefono = ?, municipio = ?,
         nivel_educativo = ?, profesion = ?, experiencia_anios = ?,
         aspiracion_salarial = ?, habilidades = ?
       WHERE id = ?`,
      [
        nombre, correo, telefono || null, municipio || null,
        nivel_educativo || null, area_interes || null,
        parseInt(experiencia_anios) || 0,
        parseFloat(aspiracion_salarial) || 0,
        descripcion || null,
        req.params.id,
      ]
    );

    res.json({ success: true, id: parseInt(req.params.id) });
  } catch (err) {
    console.error('[GeoPly] /api/registro-aspirante PUT:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.get('/api/vacantes', async (req, res) => {
  try {
    const { categoria, lat, lng, radio } = req.query;

    let sql = `
      SELECT v.*, o.nombre_organizacion, o.verificada
      FROM Vacante v
      LEFT JOIN Organizacion o ON v.organizacion_id = o.id
      WHERE 1=1`;
    const params = [];

    if (categoria) {
      sql += ' AND v.categoria = ?';
      params.push(categoria);
    }

    if (lat && lng && radio) {
      sql += `
        AND (
          6371 * ACOS(
            COS(RADIANS(?)) * COS(RADIANS(v.latitud)) *
            COS(RADIANS(v.longitud) - RADIANS(?)) +
            SIN(RADIANS(?)) * SIN(RADIANS(v.latitud))
          )
        ) <= ?`;
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radio));
    }

    sql += ' ORDER BY v.id DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[GeoPly] /api/vacantes:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.get('/api/servicios-hogar', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM ServicioHogar ORDER BY fecha_publicacion DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[GeoPly] /api/servicios-hogar:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.post('/api/servicios-hogar', async (req, res) => {
  try {
    const {
      tipo_servicio, descripcion, presupuesto_estimado,
      direccion_aprox, latitud, longitud, afiliacion_seguridad_social,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO ServicioHogar
         (tipo_servicio, descripcion, presupuesto_estimado,
          direccion_aprox, latitud, longitud, afiliacion_seguridad_social)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tipo_servicio, descripcion || null,
        parseFloat(presupuesto_estimado) || null,
        direccion_aprox || null,
        parseFloat(latitud) || null, parseFloat(longitud) || null,
        afiliacion_seguridad_social ? 1 : 0,
      ]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('[GeoPly] /api/servicios-hogar POST:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.get('/api/geoply-score/:aspiranteId/:vacanteId', async (req, res) => {
  try {
    const [[asp]] = await pool.query('SELECT * FROM Aspirante WHERE id = ?', [req.params.aspiranteId]);
    const [[vac]] = await pool.query('SELECT * FROM Vacante   WHERE id = ?', [req.params.vacanteId]);

    if (!asp || !vac) return res.status(404).json({ error: 'Aspirante o vacante no encontrado.' });

    let score = 0;
    const detalle = {};

    if (vac.salario && asp.aspiracion_salarial && vac.salario >= asp.aspiracion_salarial) {
      score += 20;
      detalle.salario = 20;
    } else {
      detalle.salario = 0;
    }

    if (asp.latitud_residencia && asp.longitud_residencia && vac.latitud && vac.longitud) {
      const distKm = haversine(
        asp.latitud_residencia, asp.longitud_residencia,
        vac.latitud, vac.longitud
      );
      if (distKm < 5)       { score += 20; detalle.distancia = 20; }
      else if (distKm < 15) { score += 10; detalle.distancia = 10; }
      else                  { detalle.distancia = 0; }
      detalle.distancia_km = Math.round(distKm * 10) / 10;
    }

    if (asp.experiencia_anios >= vac.experiencia_requerida) {
      score += 15;
      detalle.experiencia = 15;
    } else {
      detalle.experiencia = 0;
    }

    const nivelMap = { primaria: 1, bachillerato: 2, tecnico: 3, universitario: 4, posgrado: 5 };
    const nivAsp   = nivelMap[asp.nivel_educativo?.toLowerCase()] || 0;
    const nivVac   = nivelMap[vac.nivel_educativo_req?.toLowerCase()] || 0;
    if (nivAsp >= nivVac) {
      score += 15;
      detalle.nivel_educativo = 15;
    } else {
      detalle.nivel_educativo = 0;
    }

    if (vac.sector_crecimiento && vac.sector_crecimiento >= 5) {
      score += 10;
      detalle.sector_crecimiento = 10;
    } else {
      detalle.sector_crecimiento = 0;
    }

    const total = Math.min(score + 20, 100);

    res.json({
      score:   total,
      detalle,
      verdict: total >= 70 ? 'Alta Compatibilidad' : total >= 45 ? 'Compatibilidad Media' : 'Baja Compatibilidad',
    });
  } catch (err) {
    console.error('[GeoPly] /api/geoply-score:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

function haversine(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180)
             * Math.cos(lat2 * Math.PI / 180)
             * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[GeoPly] Servidor corriendo en http://localhost:${PORT}`);
});
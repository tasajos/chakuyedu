const express    = require('express');
const router     = express.Router();
const connection = require('../config/db');

// POST /api/materias/crear
router.post('/crear', (req, res) => {
  const { nombre, codigo, facultad, jefe_carrera } = req.body;
  const sql = `
    INSERT INTO materias (nombre, codigo, facultad, jefe_carrera)
    VALUES (?, ?, ?, ?)
  `;
  connection.query(sql,
    [nombre, codigo, facultad, jefe_carrera],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({
        mensaje: 'Materia creada correctamente',
        id: result.insertId
      });
    }
  );
});

// GET /api/materias
router.get('/', (req, res) => {
  const sql = `
    SELECT
      id,
      nombre,
      codigo,
      facultad,
      jefe_carrera
    FROM materias
    ORDER BY nombre
  `;
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

module.exports = router;

// backend/routes/inscripciones.routes.js
const express = require('express');
const router  = express.Router();
const connection = require('../config/db');

// GET materias asignadas a un estudiante
router.get('/:estudianteId', (req, res) => {
  const sql = `
    SELECT 
      em.materia_id,     -- <-- el verdadero id de la materia
      m.nombre
    FROM estudiante_materia em
    JOIN materias m ON em.materia_id = m.id
    WHERE em.estudiante_id = ?
  `;
  connection.query(sql, [req.params.estudianteId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST nueva asignación
router.post('/', (req, res) => {
  const { estudiante_id, materia_id } = req.body;
  const sql = 'INSERT INTO estudiante_materia (estudiante_id, materia_id) VALUES (?,?)';
  connection.query(sql, [estudiante_id, materia_id], (err, result) => {
    if(err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Asignación creada', id: result.insertId });
  });
});

module.exports = router;

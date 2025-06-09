const express    = require('express');
const router     = express.Router();
const connection = require('../config/db');

// GET /api/docente_materia/:docenteId
// Devuelve las materias asignadas a un docente + cuántos estudiantes tiene cada materia
router.get('/:docenteId', (req, res) => {
  const sql = `
    SELECT 
      dm.materia_id, 
      m.nombre, 
      COUNT(em.estudiante_id) AS student_count
    FROM docente_materia dm
    JOIN materias m ON dm.materia_id = m.id
    LEFT JOIN estudiante_materia em 
      ON em.materia_id = m.id
    WHERE dm.docente_id = ?
    GROUP BY dm.materia_id, m.nombre
  `;
  connection.query(sql, [req.params.docenteId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/docente_materia
// Asigna un docente a una materia
router.post('/', (req, res) => {
  const { docente_id, materia_id } = req.body;
  const sql = `
    INSERT INTO docente_materia (docente_id, materia_id)
    VALUES (?, ?)
  `;
  connection.query(sql, [docente_id, materia_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Asignación creada', id: result.insertId });
  });
});

module.exports = router;

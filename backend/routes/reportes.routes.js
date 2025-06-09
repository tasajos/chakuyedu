// backend/routes/reportes.routes.js
const express    = require('express');
const router     = express.Router();
const connection = require('../config/db');

// GET /api/reportes/docentes
// Devuelve lista de asignaciones docente-materia con cantidad y lista de estudiantes
router.get('/docentes', (req, res) => {
  const sql = `
    SELECT 
      u.id               AS docente_id,
      CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS docente_nombre,
      m.id               AS materia_id,
      m.nombre           AS materia_nombre,
      COUNT(em.estudiante_id) AS student_count,
      GROUP_CONCAT(
        CONCAT(e.nombre, ' ', e.apellido_paterno, ' ', e.apellido_materno)
        SEPARATOR ', '
      ) AS students
    FROM docente_materia dm
    JOIN usuarios u      ON dm.docente_id = u.id
    JOIN materias m      ON dm.materia_id = m.id
    LEFT JOIN estudiante_materia em ON em.materia_id = m.id
    LEFT JOIN usuarios e ON em.estudiante_id = e.id
    GROUP BY dm.docente_id, dm.materia_id
    ORDER BY u.apellido_paterno, m.nombre;
  `;
  connection.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Transformar students de string a array
    const result = rows.map(r => ({
      docente_id:    r.docente_id,
      docente_nombre:r.docente_nombre,
      materia_id:    r.materia_id,
      materia_nombre:r.materia_nombre,
      student_count: r.student_count,
      students:      r.students ? r.students.split(', ') : []
    }));
    res.json(result);
  });
});

module.exports = router;
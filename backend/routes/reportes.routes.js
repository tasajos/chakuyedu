// backend/routes/reportes.routes.js
const express    = require('express');
const router     = express.Router();
const connection = require('../config/db');

// GET /api/reportes/docentes
router.get('/docentes', (req, res) => {
  const sql = `
    SELECT 
      u.id                                                   AS docente_id,
      CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS docente_nombre,
      m.id                                                   AS materia_id,
      m.nombre                                               AS materia_nombre,
      COUNT(em.estudiante_id)                                AS student_count
    FROM docente_materia dm
    JOIN usuarios u      ON dm.docente_id = u.id
    JOIN materias m      ON dm.materia_id = m.id
    LEFT JOIN estudiante_materia em 
      ON em.materia_id = m.id
    WHERE dm.docente_id IN (
      SELECT docente_id FROM docente_materia
    )
    GROUP BY dm.docente_id, dm.materia_id, u.nombre, u.apellido_paterno, u.apellido_materno, m.id, m.nombre
    ORDER BY u.apellido_paterno, m.nombre
  `;

  connection.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Para cada materia asignada, consultamos los detalles de sus estudiantes
    const tareas = rows.map(row => {
      return new Promise((resolve, reject) => {
        const sql2 = `
          SELECT 
            u.id,
            u.nombre,
            u.apellido_paterno,
            u.apellido_materno,
            u.telefono,
            u.correo,
            u.carnet_identidad AS ci
          FROM usuarios u
          JOIN estudiante_materia em ON em.estudiante_id = u.id
          WHERE em.materia_id = ?
        `;
        connection.query(sql2, [row.materia_id], (e2, studs) => {
          if (e2) return reject(e2);
          resolve({
            ...row,
            students: studs  // arreglo de objetos completos
          });
        });
      });
    });

    Promise.all(tareas)
      .then(result => res.json(result))
      .catch(error => res.status(500).json({ error: error.message }));
  });
});

module.exports = router;
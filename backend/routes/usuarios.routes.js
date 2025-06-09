// backend/routes/usuarios.routes.js
const express    = require('express');
const router     = express.Router();
const connection = require('../config/db');

// POST /api/usuarios/crear
router.post('/crear', (req, res) => {
  const {
    nombre, apellido_paterno, apellido_materno,
    telefono, rol, carnet_identidad,
    correo, contrasena, fecha_nacimiento
  } = req.body;

  const sql = `
    INSERT INTO usuarios
      (nombre, apellido_paterno, apellido_materno,
       telefono, rol, carnet_identidad,
       correo, contrasena, fecha_nacimiento)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(sql, [
    nombre, apellido_paterno, apellido_materno,
    telefono, rol, carnet_identidad,
    correo, contrasena, fecha_nacimiento,estado
  ], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Usuario creado correctamente', id: result.insertId });
  });
});

// GET /api/usuarios
router.get('/', (req, res) => {
  connection.query(
    `SELECT id,nombre, apellido_paterno, apellido_materno,
       telefono, carnet_identidad AS ci, correo,rol, fecha_nacimiento,estado
FROM usuarios;`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Obtener un usuario por ID
router.get('/:id', (req, res) => {
  connection.query(
    `SELECT * FROM usuarios WHERE id = ?`,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json(results[0]);
    }
  );
});



// PATCH /api/usuarios/:id
router.patch('/:id', (req, res) => {
  const { rol, estado } = req.body;
  connection.query(
    `UPDATE usuarios SET rol = ?, estado = ? WHERE id = ?`,
    [rol, estado, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Usuario actualizado correctamente' });
    }
  );
});


module.exports = router;

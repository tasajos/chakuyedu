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
    correo, contrasena, fecha_nacimiento
  ], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Usuario creado correctamente', id: result.insertId });
  });
});

module.exports = router;

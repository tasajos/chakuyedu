// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const connection = require('../config/db');

// Ejemplo: obtener todos los usuarios
router.get('/usuarios', (req, res) => {
  connection.query('SELECT * FROM usuarios', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});


// Login
router.post('/login', (req, res) => {
  const { correo, contrasena } = req.body;

  const query = 'SELECT * FROM usuarios WHERE correo = ? AND contrasena = ?';
  connection.query(query, [correo, contrasena], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(401).json({ mensaje: 'Credenciales inválidas' });

    const usuario = results[0];
    res.json({
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  });
});

module.exports = router;

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

module.exports = router;

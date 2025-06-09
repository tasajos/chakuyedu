// backend/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas base
app.get('/', (req, res) => {
  res.send('API Educativa corriendo...');
});

// Rutas externas
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor backend en puerto ${PORT}`));

//Crear Materia API

const materiasRoutes = require('./routes/materias.routes');
app.use('/api/materias', materiasRoutes);
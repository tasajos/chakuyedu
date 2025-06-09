// backend/index.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1) Logging de todas las peticiones
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// 2) Ruta raíz
app.get('/', (req, res) => {
  res.send('API Educativa corriendo...');
});

// 3) Monta rutas
const authRoutes     = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const materiasRoutes = require('./routes/materias.routes');
const inscripcionesRoutes = require('./routes/inscripciones.routes');
const docenteMatRoutes = require('./routes/docenteMateria.routes');
const reportesRoutes = require('./routes/reportes.routes');

app.use('/api/auth',     authRoutes);
app.use('/api/usuarios',  usuariosRoutes);
app.use('/api/materias',  materiasRoutes);
app.use('/api/inscripciones', inscripcionesRoutes);
app.use('/api/docente_materia', docenteMatRoutes);
app.use('/api/reportes', reportesRoutes);

// 4) Inicia el servidor
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Servidor backend en puerto ${PORT}`));

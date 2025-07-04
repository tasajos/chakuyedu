// frontend/src/App.js
import React, { useEffect, useState } from 'react';
import Login from './Components/Login';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Logout from './Components/Logout';
import ProtectedRoute from './Components/ProtectedRoute';
import AdminDashboard from './Components/Admin/AdminDashboard';
import Navbar from './Components/Navbar';
import DocenteDashboard from './Components/Docente/DocenteDashboard';
import EstudianteDashboard from './Components/Estudiante/EstudianteDashboard';
import GestionAcademica from './Components/Admin/GestionAcademica/GestionAcademica';
import CrearMateria from './Components/Admin/GestionAcademica/CrearMateria';
import SidebarMenu from './Components/SidebarMenu';
import GestionUsuarios from './Components/Admin/GestionUsuarios/GestionUsuarios';
import ReporteUsuarios from './Components/Admin/GestionUsuarios/ReporteUsuarios';
import CrearUsuario from './Components/Admin/GestionUsuarios/CrearUsuarios';
import ListarUsuarios from './Components/Admin/GestionUsuarios/ListarUsuarios';
import GestionDocente from './Components/Admin/GestionDocente/GestionDocente';
import CrearDocente from './Components/Admin/GestionDocente/CrearDocente';
import ListarDocentes from './Components/Admin/GestionDocente/ListarDocentes';
import AsignarEstudiantes from './Components/Admin/GestionAcademica/AsignarEstudiantes';
import AsignarDocenteMateria from './Components/Admin/GestionAcademica/AsignarDocenteMateria';
import AsistenciaMaterias from './Components/Admin/GestionAcademica/AsistenciaMateria/AsistenciaMaterias';
import RegistrarAsistencia from './Components/Admin/GestionAcademica/AsistenciaMateria/RegistrarAsistencia';
import ReporteDocenteMateria from './Components/Admin/GestionDocente/ReporteDocentes';
import Mantenimiento from './Components/Admin/GestionMantenimiento/Mantenimiento';
import ListarAdmins from './Components/Admin/GestionMantenimiento/ListarAdmins';
import ListadoAsistencia from './Components/Admin/GestionAcademica/AsistenciaMateria/ListadoAsistencia';
import ReporteAsistencia from './Components/Admin/GestionAcademica/AsistenciaMateria/ReporteAsistencia';




//Docentes
import Gdmateria from './Components/Docente/GestionMateria/GestionMaterias';
import ListaDmateria from './Components/Docente/GestionMateria/ListaEstudiantesMateria';
import DocenteRegistrarAsistencia from './Components/Docente/GestionMateria/DocenteRegistrarAsistencia';
import AsignarTarea from './Components/Docente/GestionMateria/AsignarTarea';
import SeguimientoEstudiante from './Components/Docente/GestionEstudiante/SeguimientoEstudiante';
import SistemaAcademico from './Components/Docente/GestionAcademica/SistemaAcademico';
import CalificacionFinal from './Components/Docente/GestionAcademica/CalificacionFinal';
import PerfilDocente from './Components/Docente/PerfilDocente/PerfilDocentes';
import CrearExamen from './Components/Docente/GestionMateria/CrearExamen';
import axios from 'axios';
//Estudiante
import EstudianteMaterias from './Components/Estudiante/GestionMateria/EstudianteMateria';
import EstudianteMateriaDetalle from './Components/Estudiante/GestionMateria/EstudianteMateriaDetalle';
import PerfilEstudiante from './Components/Estudiante/PerfilEstudiante/PerfilEstudiantes';
import EstudianteTareas from './Components/Estudiante/ExamenesyTareas/EstudianteTareas';
import EstudianteCertificados from './Components/Estudiante/Certificados/EstudiantesCertificados';
import EstudianteExamenes from './Components/Estudiante/Examenes/EstudianteExamenes';
import RendirExamen from './Components/Estudiante/Examenes/RendirExamen';
// Estos son placeholders, 
/*const Admin = () => <h2>Panel Admin</h2>;
const Docente = () => <h2>Panel Docente</h2>;
const Estudiante = () => <h2>Panel Estudiante</h2>;*/

const Admin = () => (
  <div className="container mt-5">
    <h2>Panel Admin</h2>
    <Logout />
  </div>
);

const Docente = () => (
  <div className="container mt-5">
    <h2>Panel Docente</h2>
    <Logout />
  </div>
);

const Estudiante = () => (
  <div className="container mt-5">
    <h2>Panel Estudiante</h2>
    <Logout />
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"           element={<Login />} />


        <Route path="/admin"      element={
        <ProtectedRoute rolPermitido="admin">
           <Navbar />
           <SidebarMenu />
            <AdminDashboard />
            {/*<Logout />*/}
          </ProtectedRoute>
        }/>

         <Route path="/admin/GestionAcademica/GestionAcademica" element={
          <ProtectedRoute rolPermitido="admin">
            <SidebarMenu />
             <Navbar />
            <GestionAcademica />
          </ProtectedRoute>
        }/>


        <Route path="/admin/academica/crear-materias" element={
        <ProtectedRoute rolPermitido="admin">
          <SidebarMenu />
          <Navbar />
        <CrearMateria />
        </ProtectedRoute>
        }/>

      <Route path="/admin/GestionUsuarios/GestionUsuarios" element={
        <ProtectedRoute rolPermitido="admin">
          <SidebarMenu />
          <Navbar />
        <GestionUsuarios />
        </ProtectedRoute>
        }/>

          <Route path="/admin/GestionUsuarios/ReporteUsuarios" element={
        <ProtectedRoute rolPermitido="admin">
          <SidebarMenu />
          <Navbar />
        <ReporteUsuarios />
        </ProtectedRoute>
        }/>


        <Route path="/admin/GestionUsuarios/CrearUsuarios" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <CrearUsuario />
        </ProtectedRoute>
        }/>

        <Route path="/admin/GestionUsuarios/ListarUsuarios" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <ListarUsuarios />
        </ProtectedRoute>
        }/>

        <Route path="/admin/GestionDocente/GestionDocente" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <GestionDocente />
        </ProtectedRoute>
        }/>

         <Route path="/admin/GestionDocente/CrearDocente" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <CrearDocente />
        </ProtectedRoute>
        }/>

         <Route path="/admin/GestionDocente/ListarDocentes" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <ListarDocentes />
        </ProtectedRoute>
        }/>


 <Route path="/admin/GestionAcademica/AsignarEstudiantes" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <AsignarEstudiantes />
        </ProtectedRoute>
        }/>


         <Route path="/admin/GestionAcademica/AsignarDocenteMateria" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <AsignarDocenteMateria />
        </ProtectedRoute>
        }/>

         <Route path="/admin/GestionDocente/ReporteDocentes" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <ReporteDocenteMateria />
        </ProtectedRoute>
        }/>

        <Route path="/admin/GestionAcademica/AsistenciaMateria/AsistenciaMaterias" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <AsistenciaMaterias />
        </ProtectedRoute>
        }/>

 <Route path="/admin/GestionAcademica/AsistenciaMateria/RegistrarAsistencia" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <RegistrarAsistencia />
        </ProtectedRoute>
        }/>


         <Route path="/admin/GestionMantenimiento/Mantenimiento" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <Mantenimiento />
        </ProtectedRoute>
        }/>

 <Route path="/admin/listar-admins" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <ListarAdmins  />
        </ProtectedRoute>
        }/>


 <Route path="/admin/asistencia/listado" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <ListadoAsistencia   />
        </ProtectedRoute>
        }/>


<Route path="/admin/asistencia/reporte" element={
        <ProtectedRoute rolPermitido="admin">
        <SidebarMenu />
        <Navbar />
        <ReporteAsistencia    />
        </ProtectedRoute>
        }/>







             {/*DOCENTES
             
             
             */}
        <Route path="/docente"    element={
          
         <ProtectedRoute rolPermitido="docente">
           <Navbar />
            <DocenteDashboard  />
              <SidebarMenu />
            {/*<Logout />*/}
          </ProtectedRoute>
        }/>

          <Route path="/docente/GestionMateria/GestionMaterias"    element={
          
         <ProtectedRoute rolPermitido="docente">
           <Navbar />
            <Gdmateria  />
              <SidebarMenu />
            {/*<Logout />*/}
          </ProtectedRoute>
        }/>

          <Route 
  path="/docente/materia/:materiaId" // <-- 1. RUTA DINÁMICA
  element={
    <ProtectedRoute rolPermitido="docente">
      <Navbar />
      {/* 2. El componente ListaDmateria ya incluye su propio SidebarMenu y layout */}
      <ListaDmateria />
    </ProtectedRoute>
  }
/>
        

<Route 
  path="/docente/GestionMateria/DocenteRegistrarAsistencia" 
  element={
    <ProtectedRoute rolPermitido="docente">
      <Navbar />
      <DocenteRegistrarAsistencia />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/docente/materia/:materiaId/asignar-tarea" 
  element={
    <ProtectedRoute rolPermitido="docente">
      <Navbar />
      <AsignarTarea />
    </ProtectedRoute>
  }
/>

<Route 
  path="/Docente/GestionEstudiante/SeguimientoEstudiante" 
  element={
    <ProtectedRoute rolPermitido="docente">
      <Navbar />
      <SeguimientoEstudiante />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/Docente/GestionAcademica/SistemaAcademico" 
  element={
    <ProtectedRoute rolPermitido="docente">
      <Navbar />
      <SistemaAcademico />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/Docente/GestionAcademica/CalificacionFinal" 
  element={
    <ProtectedRoute rolPermitido="docente">
      <Navbar />
      <CalificacionFinal />
    </ProtectedRoute>
  } 
/>


<Route 
  path="/Docente/PerfilDocente/PerfilDocentes" 
  element={
    <ProtectedRoute rolPermitido="docente">
      <Navbar />
      <PerfilDocente />
    </ProtectedRoute>
  } 
/>


<Route 
  path="/docente/materia/:materiaId/crear-examen" 
  element={
    <ProtectedRoute rolPermitido="docente">
      <Navbar />
      <CrearExamen  />
    </ProtectedRoute>
  } 
/>








        

         {/*ESTUDIANTES
             
             
             */}

        <Route path="/estudiante" element={
          <ProtectedRoute rolPermitido="estudiante">
           <Navbar />
            <EstudianteDashboard  />
            {/*<Logout />*/}
          </ProtectedRoute>
        }/>

      <Route path="/Estudiante/GestionMateria/EstudianteMateria" element={
      <ProtectedRoute rolPermitido="estudiante">
      <Navbar /> {/* Asumiendo una barra de navegación para estudiantes */}
      <EstudianteMaterias />
    </ProtectedRoute>
      }/>

  <Route path="/estudiante/materia/:materiaId" element={
    <ProtectedRoute rolPermitido="estudiante">
      <Navbar />
      <EstudianteMateriaDetalle />
    </ProtectedRoute>
    } />


<Route path="/Estudiante/PerfilEstudiante/PerfilEstudiantes" element={
    <ProtectedRoute rolPermitido="estudiante">
      <Navbar />
      <PerfilEstudiante />
    </ProtectedRoute>
  } />

<Route path="/Estudiante/ExamenesyTareas/EstudianteTareas" element={
    <ProtectedRoute rolPermitido="estudiante">
      <Navbar />
      <EstudianteTareas />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/Estudiante/Certificados/EstudiantesCertificados" 
  element={
    <ProtectedRoute rolPermitido="estudiante">
      <Navbar />
      <EstudianteCertificados />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/Estudiante/Examenes/EstudianteExamenes" 
  element={
    <ProtectedRoute rolPermitido="estudiante">
      <Navbar />
      <EstudianteExamenes  />
    </ProtectedRoute>
  } 
/>


<Route 
  path="/estudiante/examen/:asignacionId" 
  element={
    <ProtectedRoute rolPermitido="estudiante">
      <Navbar />
      <RendirExamen   />
    </ProtectedRoute>
  } 
/>



      </Routes>
    </Router>
  );
}

export default App;



// frontend/src/App.js
import React, { useEffect, useState } from 'react';
import Login from './Components/Login';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Logout from './Components/Logout';
import ProtectedRoute from './Components/ProtectedRoute';
import AdminDashboard from './Components/Admin/AdminDashboard';
import Navbar from './Components/Navbar';
import DocenteDashboard from './Components/Docente/DocenteDashboard';
import EstudianteDashboard from './Components/Estudiante/EstudianteDashboard';
import GestionAcademica from './Components/Admin/GestionAcademica/GestionAcademica';
import CrearMateria from './Components/Admin/GestionAcademica/CrearMateria';
import axios from 'axios';


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
            <AdminDashboard />
            {/*<Logout />*/}
          </ProtectedRoute>
        }/>

         <Route path="/admin/GestionAcademica/GestionAcademica" element={
          <ProtectedRoute rolPermitido="admin">
             <Navbar />
            <GestionAcademica />
          </ProtectedRoute>
        }/>


        <Route path="/admin/academica/crear-materias" element={
        <ProtectedRoute rolPermitido="admin">
          <Navbar />
        <CrearMateria />
        </ProtectedRoute>
        }/>
             
        <Route path="/docente"    element={
          
         <ProtectedRoute rolPermitido="docente">
           <Navbar />
            <DocenteDashboard  />
            {/*<Logout />*/}
          </ProtectedRoute>
        }/>
        
        

        <Route path="/estudiante" element={
          <ProtectedRoute rolPermitido="estudiante">
           <Navbar />
            <EstudianteDashboard  />
            {/*<Logout />*/}
          </ProtectedRoute>
        }/>
      </Routes>
    </Router>
  );
}

export default App;



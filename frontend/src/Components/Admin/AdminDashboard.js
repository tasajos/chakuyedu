import React, { Component } from 'react';
import { Settings, Users, UserCheck, BookOpen, BarChart2 } from 'lucide-react';
import '../../Styles/Admin/AdminDashboard.css';
import NavBar from '../Navbar';
import '../../Styles/Navbar.css';

class AdminDashboard extends Component {
  handleClick = (ruta) => {
    window.location.href = ruta;
  }

  renderCard(icon, title, desc, ruta) {
    return (
      <div className="col-sm-6 col-md-4">
        <div
          className="card admin-card h-100 text-center p-4"
          onClick={() => this.handleClick(ruta)}
        >
          <div className="icon-container mb-3">
            {icon}
          </div>
          <h5 className="card-title">{title}</h5>
          <p className="card-text">{desc}</p>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="container mt-5">
 
        <h2 className="mb-4">Panel de Administración</h2>
        <div className="row g-4">
          {this.renderCard(
            <Settings size={48} className="text-primary"/>,
            'Mantenimiento',
            'Parámetros y configuraciones del sistema.',
            '/admin/mantenimiento'
          )}
          {this.renderCard(
            <Users size={48} className="text-success"/>,
            'Gestión Usuarios',
            'Crear, editar y eliminar cuentas de usuario.',
            '/admin/usuarios'
          )}
          {this.renderCard(
            <UserCheck size={48} className="text-warning"/>,
            'Gestión Docente',
            'Administrar perfiles y asignaciones de docentes.',
            '/admin/docentes'
          )}
          {this.renderCard(
            <BookOpen size={48} className="text-info"/>,
            'Gestión Académica',
            'Crear materias y asignar planificaciones.',
            '/admin/academica'
          )}
          {this.renderCard(
            <BarChart2 size={48} className="text-danger"/>,
            'Informes',
            'Ver reportes de uso, asistencia y calificaciones.',
            '/admin/informes'
          )}
        </div>
      </div>
    );
  }
}

export default AdminDashboard;

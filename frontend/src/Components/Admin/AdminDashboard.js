// src/Components/Admin/AdminDashboard.js
import React, { Component } from 'react';
import SidebarMenu from '../SidebarMenu';
import { Settings, Users, UserCheck, BookOpen, BarChart2 } from 'lucide-react';
import '../../Styles/Admin/AdminDashboard.css';

class AdminDashboard extends Component {
  handleClick = ruta => window.location.href = ruta;

  renderCard(icon, title, desc, ruta) {
    return (
      <div className="col">
        <div className="card admin-card h-100 text-center p-3"
             onClick={() => this.handleClick(ruta)}>
          <div className="icon-container mb-2">{icon}</div>
          <h6 className="card-title">{title}</h6>
          <p className="card-text">{desc}</p>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <h2 className="mb-4">Panel de Administración</h2>
          <div className="row row-cols-1 row-cols-md-2 g-4">
            {this.renderCard(<Settings size={32} className="text-primary"/>,
              'Mantenimiento','Parámetros y configuraciones.','/admin/GestionMantenimiento/Mantenimiento')}
            {this.renderCard(<Users size={32} className="text-success"/>,
              'Gestión Usuarios','Crear y editar cuentas.','/admin/GestionUsuarios/GestionUsuarios')}
            {this.renderCard(<UserCheck size={32} className="text-warning"/>,
              'Gestión Docente','Perfiles y asignaciones.','/admin/GestionDocente/GestionDocente')}
            {this.renderCard(<BookOpen size={32} className="text-info"/>,
              'Gestión Académica','Materias y planificación.','/admin/GestionAcademica/GestionAcademica')}
           
           {/*
            {this.renderCard(<BarChart2 size={32} className="text-danger"/>,
              'Informes','Reportes y estadísticas.','/admin/informes')} */}
          </div>
        </main>
      </div>
    );
  }
}

export default AdminDashboard;
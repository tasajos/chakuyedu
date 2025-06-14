import React, { Component } from 'react';
import SidebarMenu from '../SidebarMenu'; // Asegúrate que la ruta sea correcta
import { BookOpen, Users, ClipboardList, User } from 'lucide-react';
import '../../Styles/Docente/DocenteDashboard.css'; // Asegúrate que la ruta al CSS sea correcta

class DocenteDashboard extends Component {
  // Método de navegación con recarga de página, igual al del AdminDashboard
  handleClick = ruta => window.location.href = ruta;

  // Método para renderizar cada tarjeta, igual al del AdminDashboard
  renderCard(icon, title, desc, ruta) {
    return (
      <div className="col">
        <div 
          className="card docente-card h-100 text-center p-4" // Se puede usar 'docente-card' o 'admin-card' si comparten estilos
          onClick={() => this.handleClick(ruta)}
        >
          <div className="icon-container mb-3">{icon}</div>
          <h5 className="card-title">{title}</h5>
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
          <h2 className="mb-4">Panel Docente</h2>
          {/* Usamos g-4 como en tus versiones funcionales para un espaciado consistente */}
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 g-4">
            {this.renderCard(
              <BookOpen size={48} className="text-primary"/>,
              'Gestión Materias',
              'Crear y actualizar la información de materias.',
              '/docente/GestionMateria/GestionMaterias'
            )}
            {this.renderCard(
              <Users size={48} className="text-success"/>,
              'Gestión Estudiantes',
              'Ver y gestionar la lista de estudiantes.',
              '/docente/estudiantes'
            )}
            {this.renderCard(
              <ClipboardList size={48} className="text-info"/>,
              'Gestión Académica',
              'Planificación académica y seguimiento.',
              '/docente/academica'
            )}
            {this.renderCard(
              <User size={48} className="text-warning"/>,
              'Perfil',
              'Ver y editar tu perfil de docente.',
              '/docente/perfil'
            )}
          </div>
        </main>
      </div>
    );
  }
}

export default DocenteDashboard;
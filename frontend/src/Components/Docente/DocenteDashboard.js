import React, { Component } from 'react';
import { BookOpen, Users, ClipboardList, User } from 'lucide-react';

import '../../Styles/Docente/DocenteDashboard.css';

class DocenteDashboard extends Component {
  handleClick = (ruta) => {
    window.location.href = ruta;
  }

  renderCard(icon, title, desc, ruta) {
    return (
      <div className="col-sm-6 col-md-4">
        <div
          className="card docente-card h-100 text-center p-4"
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
      <>
           <div className="container mt-5">
          <h2 className="mb-4">Panel Docente</h2>
          <div className="row g-4">
            {this.renderCard(
              <BookOpen size={48} className="text-primary" />,
              'Gestión Materias',
              'Crear y actualizar la información de materias.',
              '/docente/materias'
            )}
            {this.renderCard(
              <Users size={48} className="text-success" />,
              'Gestión Estudiantes',
              'Ver y gestionar la lista de estudiantes.',
              '/docente/estudiantes'
            )}
            {this.renderCard(
              <ClipboardList size={48} className="text-info" />,
              'Gestión Académica',
              'Planificación académica y seguimiento.',
              '/docente/academica'
            )}
            {this.renderCard(
              <User size={48} className="text-warning" />,
              'Perfil',
              'Ver y editar tu perfil de docente.',
              '/docente/perfil'
            )}
          </div>
        </div>
      </>
    );
  }
}

export default DocenteDashboard;

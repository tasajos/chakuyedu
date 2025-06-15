import React, { Component } from 'react';
import { BookOpen, User, FileText, Award } from 'lucide-react';
import '../../Styles/Estudiante/EstudianteDashboard.css';

class EstudianteDashboard extends Component {
  handleClick = (ruta) => {
    window.location.href = ruta;
  }

  renderCard(icon, title, desc, ruta) {
    return (
      <div className="col-sm-6 col-md-4">
        <div
          className="card estudiante-card h-100 text-center p-4"
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
          <h2 className="mb-4">Panel Estudiante</h2>
          <div className="row g-4">
            {this.renderCard(
              <BookOpen size={48} className="text-primary" />,
              'Materias',
              'Ver las materias en las que estás inscrito.',
              '/Estudiante/GestionMateria/EstudianteMateria'
            )}
            {this.renderCard(
              <User size={48} className="text-success" />,
              'Perfil',
              'Revisa y edita tu información personal.',
              '/Estudiante/PerfilEstudiante/PerfilEstudiantes'
            )}
            {this.renderCard(
              <FileText size={48} className="text-info" />,
              'Exámenes y Tareas',
              'Accede a tus exámenes y prácticas.',
              '/estudiante/examenes'
            )}
            {this.renderCard(
              <Award size={48} className="text-warning" />,
              'Certificados',
              'Descarga tus certificados y badges.',
              '/estudiante/certificados'
            )}
          </div>
        </div>
      </>
    );
  }
}

export default EstudianteDashboard;

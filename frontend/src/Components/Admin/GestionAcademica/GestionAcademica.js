// frontend/src/Components/Admin/GestionAcademica.js
import React, { Component } from 'react';
import { BookOpen, UserPlus, UserCheck, ClipboardList } from 'lucide-react';
import '../../../Styles/Admin/GestionAcademica.css';

class GestionAcademica extends Component {
  handleClick = (ruta) => {
    window.location.href = ruta;
  }

  renderCard(icon, title, desc, ruta) {
    return ( 
      <div className="col-sm-6 col-md-4">
        <div
          className="card gestion-card h-100 text-center p-4"
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
        {/* Contenedor con margen izquierdo para prevenir solapamiento con sidebar */}
        <div className="gestion-academica-container">
          <div className="container mt-5">
            <h2 className="mb-4">Gestión Académica</h2>
            <div className="row g-4">
              {this.renderCard(
                <BookOpen size={48} className="text-primary" />,
                'Crear Materias',
                'Definir y dar de alta nuevas materias.',
                '/admin/academica/crear-materias'
              )}
              {this.renderCard(
                <UserPlus size={48} className="text-success" />,
                'Asignar Estudiantes',
                'Inscribir estudiantes en materias.',
                '/admin/GestionAcademica/AsignarEstudiantes'
              )}
              {this.renderCard(
                <UserCheck size={48} className="text-warning" />,
                'Asignar Docente–Materia',
                'Vincular docentes a las materias.',
                '/admin/GestionAcademica/AsignarDocenteMateria'
              )}
                {this.renderCard(
                <ClipboardList size={48} className="text-info" />,
                'Asistencia-Materia',
                'Lista de asistencia de estudiantes por materia',
                '/admin/GestionAcademica/AsistenciaMateria/AsistenciaMaterias'
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default GestionAcademica;

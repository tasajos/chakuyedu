// frontend/src/Components/Admin/GestionAcademica/AsistenciaMateria/AsistenciaMateria.js
import React, { Component } from 'react';
// Importamos los íconos necesarios para las tarjetas
import { CheckSquare, ClipboardList, FileText } from 'lucide-react';
// Importamos el nuevo archivo de estilos
import '../../../../Styles/Admin/AsistenciaMateria.css';

class AsistenciaMateria extends Component {
  handleClick = (ruta) => {
    // En un futuro, podrías usar react-router-dom para una navegación más limpia
    window.location.href = ruta;
  }

  // La función para renderizar tarjetas es reutilizada del componente anterior
  renderCard(icon, title, desc, ruta) {
    return ( 
      <div className="col-md-4"> {/* Ajustado para que siempre haya 3 por fila en pantallas medianas y grandes */}
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
        {/* Contenedor principal con un nombre de clase específico */}
        <div className="asistencia-materia-container">
          <div className="container mt-5">
            <h2 className="mb-4">Gestión de Asistencia</h2>
            <div className="row g-4 justify-content-center"> {/* Centramos las tarjetas */}
              
              {/* Card 1: Registrar Asistencia */}
              {this.renderCard(
                <CheckSquare size={48} className="text-success" />,
                'Registrar Asistencia',
                'Marcar la asistencia de los estudiantes para una fecha específica.',
                '/admin/asistencia/registrar' // Ruta sugerida
              )}

              {/* Card 2: Listado de Asistencia */}
              {this.renderCard(
                <ClipboardList size={48} className="text-primary" />,
                'Listado de Asistencia',
                'Ver el historial completo de asistencia por materia.',
                '/admin/asistencia/listado' // Ruta sugerida
              )}

              {/* Card 3: Reporte de Asistencia */}
              {this.renderCard(
                <FileText size={48} className="text-danger" />,
                'Reporte de Asistencia',
                'Generar reportes detallados por docente y materia.',
                '/admin/asistencia/reporte' // Ruta sugerida
              )}

            </div>
          </div>
        </div>
      </>
    );
  }
}

export default AsistenciaMateria;
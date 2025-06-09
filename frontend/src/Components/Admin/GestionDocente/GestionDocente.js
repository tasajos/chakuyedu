import React, { Component } from 'react';
import { UserCheck, Users, BarChart2 } from 'lucide-react';

import '../../../Styles/Admin/GestionDocente.css';

class GestionDocente extends Component {
  handleClick = (ruta) => {
    window.location.href = ruta;
  }

  renderCard(icon, title, desc, ruta) {
    return (
      <div className="col-sm-6 col-md-4">
        <div
          className="card gestion-docente-card h-100 text-center p-4"
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
   
        <div className="dashboard-layout">
       

          <main className="main-content">
            <div className="container mt-5">
              <h2 className="mb-4">Gestión Docente</h2>
              <div className="row g-4">
                {this.renderCard(
                  <UserCheck size={48} className="text-primary" />,
                  'Crear Docente',
                  'Registrar nuevos profesores en el sistema.',
                  '/admin/GestionDocente/CrearDocente'
                )}
                {this.renderCard(
                  <Users size={48} className="text-success" />,
                  'Listar Docentes',
                  'Ver, editar y eliminar profesores existentes.',
                  '/admin/GestionDocente/ListarDocentes'
                )}
                {this.renderCard(
                  <BarChart2 size={48} className="text-warning" />,
                  'Reporte Docentes',
                  'Generar reportes de actividad y desempeño.',
                  '/admin/GestionDocente/ReporteDocentes'
                )}
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
}

export default GestionDocente;

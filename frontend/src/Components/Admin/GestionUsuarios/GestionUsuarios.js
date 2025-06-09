// frontend/src/components/GestionUsuarios.js
import React, { Component } from 'react';
import { UserPlus, List, BarChart2 } from 'lucide-react';


import '../../../Styles/Admin/GestionUsuarios.css';

class GestionUsuarios extends Component {
  handleClick = (ruta) => {
    window.location.href = ruta;
  }

  renderCard(icon, title, desc, ruta) {
    return (
      <div className="col-sm-6 col-md-4">
        <div
          className="card gestionUsuarios-card h-100 text-center p-4"
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
              <h2 className="mb-4">Gestión Usuarios</h2>
              <div className="row g-4">
                {this.renderCard(
                  <UserPlus size={48} className="text-primary" />,
                  'Crear Usuario',
                  'Alta de nuevos usuarios al sistema.',
                  '/admin/GestionUsuarios/CrearUsuarios'
                )}
                {this.renderCard(
                  <List size={48} className="text-success" />,
                  'Listar Usuarios',
                  'Ver, editar y eliminar usuarios existentes.',
                  '/admin/usuarios/listar'
                )}
                {this.renderCard(
                  <BarChart2 size={48} className="text-warning" />,
                  'Reporte Usuarios',
                  'Generar reportes de actividad de usuarios.',
                  '/admin/usuarios/reporte'
                )}
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
}

export default GestionUsuarios;

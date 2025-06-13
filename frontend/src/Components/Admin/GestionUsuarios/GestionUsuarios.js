// frontend/src/components/GestionUsuarios.js (CORREGIDO)
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
      // Se eliminaron los divs de layout. Ahora el componente solo renderiza su contenedor principal.
      <div className="gestion-usuarios-container">
        <div className="container mt-5">
          <h2 className="mb-4">Gestión Usuarios</h2>
          <div className="row g-4 justify-content-center"> {/* Opcional: centrar las tarjetas si son menos de 3 */}
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
              '/admin/GestionUsuarios/ListarUsuarios'
            )}
            {this.renderCard(
              <BarChart2 size={48} className="text-warning" />,
              'Reporte Usuarios',
              'Generar reportes de actividad de usuarios.',
              '/admin/GestionUsuarios/ReporteUsuarios'
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default GestionUsuarios;
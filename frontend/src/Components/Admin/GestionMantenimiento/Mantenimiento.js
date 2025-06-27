import React, { Component } from 'react';
import SidebarMenu from '../../SidebarMenu';
// Importamos los íconos para las nuevas tarjetas
import { DatabaseBackup, ShieldCheck } from 'lucide-react'; 
// Reutilizamos los estilos del AdminDashboard para que las tarjetas se vean igual
import '../../../Styles/Admin/AdminDashboard.css'; 

class Mantenimiento extends Component {
  // Reutilizamos el mismo método para la navegación
  handleClick = (ruta) => {
    // Añadimos un caso especial para el respaldo, ya que no es una ruta
    if (ruta === 'respaldo') {
      alert('La funcionalidad de respaldo de base de datos requiere un proceso en el servidor y está pendiente de implementación.');
      // En una implementación real, aquí se llamaría a una API o Cloud Function.
      return;
    }
    window.location.href = ruta;
  }

  // Reutilizamos exactamente el mismo método para renderizar las tarjetas
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
      // Usamos el mismo layout para consistencia visual
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <h2 className="mb-4">Mantenimiento del Sistema</h2>
          <div className="row row-cols-1 row-cols-md-2 g-4">
            
            {/* Tarjeta para Respaldo de Base de Datos */}
            {this.renderCard(
              <DatabaseBackup size={32} className="text-info"/>,
              'Respaldo de Base de Datos',
              'Generar y descargar copias de seguridad de la base de datos.',
              'respaldo' // Usamos un identificador especial
            )}

            {/* Tarjeta para Listado de Administradores */}
            {this.renderCard(
              <ShieldCheck size={32} className="text-danger"/>,
              'Listado de Administradores',
              'Ver, editar y gestionar los usuarios con rol de administrador.',
              '/admin/listar-admins' // Ruta para el futuro componente
            )}

          </div>
        </main>
      </div>
    );
  }
}

export default Mantenimiento;
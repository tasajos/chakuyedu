import React, { Component } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Eye, Edit2, Search } from 'lucide-react';
// Reutilizamos los mismos estilos de ListarUsuarios para mantener la consistencia
import '../../../Styles/Admin/ListarUsuarios.css'; 

class ListarAdmins extends Component {
  // Cambiamos 'usuarios' por 'admins' para mayor claridad
  state = {
    admins: [],
    filtro: '',
    viewUser: null,
    editUser: null,
    newRole: '',
    newEstado: '',
    newCorreo: ''
  };

  componentDidMount() {
    this.fetchAdmins();
  }

  // Método específico para traer solo administradores
  fetchAdmins = async () => {
    try {
      // --- LA ÚNICA DIFERENCIA CLAVE ESTÁ AQUÍ ---
      // Creamos una consulta que filtra por rol == 'admin' directamente en Firestore
      const q = query(collection(db, 'usuarios'), where('rol', '==', 'admin'));
      const snapshot = await getDocs(q);
      const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.setState({ admins });
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  }

  // El resto de los métodos son idénticos a ListarUsuarios.js
  handleFiltroChange = e => {
    this.setState({ filtro: e.target.value });
  }

  safe = v => (v || '').toString().toLowerCase();

  openViewModal = user => this.setState({ viewUser: user });
  closeViewModal = () => this.setState({ viewUser: null });

  openEditModal = user => this.setState({
    editUser: user,
    newRole: user.rol,
    newEstado: (user.estado ?? 1).toString(),
    newCorreo: user.correo
  });
  closeEditModal = () => this.setState({ editUser: null });

  handleEditChange = e => this.setState({ [e.target.name]: e.target.value });

  saveEdit = async () => {
    const { editUser, newRole, newEstado, newCorreo } = this.state;
    try {
      const userRef = doc(db, 'usuarios', editUser.id);
      await updateDoc(userRef, { 
        rol: newRole, 
        estado: Number(newEstado),
        correo: newCorreo 
      });
      await this.fetchAdmins(); // Llama a fetchAdmins para refrescar
      this.closeEditModal();
    } catch (err) {
      console.error('Error updating usuario:', err);
    }
  }

  renderEstado = (estado) => {
    switch (Number(estado)) {
      case 1: return 'Habilitado';
      case 2: return 'Deshabilitado';
      default: return 'Desconocido';
    }
  }
  
  getEstadoClass = (estado) => {
    switch (Number(estado)) {
      case 1: return 'bg-success';
      case 2: return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getInitials = (nombre, apellido) => {
    const n = nombre ? nombre[0] : '';
    const a = apellido ? apellido[0] : '';
    return `${n}${a}`.toUpperCase();
  }

  generateColorForId = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  }

  render() {
    const { admins, filtro, viewUser, editUser, newRole, newEstado, newCorreo } = this.state;
    const texto = filtro.toLowerCase();
    const filtrados = admins.filter(u =>
      this.safe(u.nombre).includes(texto) ||
      this.safe(u.apellido_paterno).includes(texto) ||
      this.safe(u.correo).includes(texto)
    );

    return (
      <div className="listar-usuarios-container">
        <div className="card listar-usuarios-card p-4">
          <h3 className="mb-4">Listado de Administradores</h3>
          
          <div className="mb-4 filter-container">
            <Search className="filter-icon" size={18} />
            <input
              type="text"
              placeholder="Filtrar administradores..."
              className="form-control"
              value={filtro}
              onChange={this.handleFiltroChange}
            />
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>CI</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar" style={{ backgroundColor: this.generateColorForId(u.id) }}>
                          {this.getInitials(u.nombre, u.apellido_paterno)}
                        </div>
                        <div>
                          <div className="user-name">{u.nombre} {u.apellido_paterno}</div>
                          <div className="user-email">{u.correo}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.carnet_identidad}</td>
                    <td>
                      <span className={`badge ${this.getEstadoClass(u.estado)}`}>
                        {this.renderEstado(u.estado)}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-outline-info" onClick={() => this.openViewModal(u)}>
                        <Eye size={16}/> Ver
                      </button>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => this.openEditModal(u)}>
                        <Edit2 size={16}/> Modificar
                      </button>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-5">No hay administradores que coincidan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Modal (sin cambios) */}
        {viewUser && ( <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>...</div> )}

        {/* Edit Modal (modificado para no mostrar ciertos campos de estado) */}
        {editUser && (
          <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Modificar Administrador</h5>
                  <button type="button" className="btn-close" onClick={this.closeEditModal}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Correo Electrónico</label>
                    <input type="email" name="newCorreo" value={newCorreo} onChange={this.handleEditChange} className="form-control" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rol</label>
                    <select name="newRole" value={newRole} onChange={this.handleEditChange} className="form-select">
                      <option value="admin">Administrador</option>
                      <option value="docente">Docente</option>
                      <option value="estudiante">Estudiante</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Estado</label>
                    <select name="newEstado" value={newEstado} onChange={this.handleEditChange} className="form-select">
                      <option value="1">Habilitado</option>
                      <option value="2">Deshabilitado</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={this.closeEditModal}>Cancelar</button>
                  <button type="button" className="btn btn-primary" onClick={this.saveEdit}>Guardar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default ListarAdmins;
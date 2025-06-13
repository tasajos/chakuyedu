import React, { Component } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Eye, Edit2, Search } from 'lucide-react';
import '../../../Styles/Admin/ListarUsuarios.css';

class ListarUsuarios extends Component {
  state = {
    usuarios: [],
    filtro: '',
    viewUser: null,
    editUser: null,
    newRole: '',
    newEstado: ''
  };

  async componentDidMount() {
    await this.fetchUsuarios();
  }

  fetchUsuarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'usuarios'));
      const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.setState({ usuarios });
    } catch (err) {
      console.error('Error fetching usuarios:', err);
    }
  }

  handleFiltroChange = e => {
    this.setState({ filtro: e.target.value });
  }

  safe = v => (v || '').toString().toLowerCase();

  openViewModal = user => this.setState({ viewUser: user });
  closeViewModal = () => this.setState({ viewUser: null });

  openEditModal = user => this.setState({
    editUser: user,
    newRole: user.rol,
    newEstado: (user.estado ?? 1).toString()
  });
  closeEditModal = () => this.setState({ editUser: null });

  handleEditChange = e => this.setState({ [e.target.name]: e.target.value });

  saveEdit = async () => {
    const { editUser, newRole, newEstado } = this.state;
    try {
      const userRef = doc(db, 'usuarios', editUser.id);
      await updateDoc(userRef, { rol: newRole, estado: Number(newEstado) });
      await this.fetchUsuarios();
      this.closeEditModal();
    } catch (err) {
      console.error('Error updating usuario:', err);
    }
  }

  renderEstado = (estado) => {
    switch (Number(estado)) {
      case 1: return 'Habilitado';
      case 2: return 'Deshabilitado';
      case 3: return 'Habilitado con Observacion';
      case 4: return 'Deudas Pendientes';
      default: return 'Desconocido';
    }
  }
  
  getEstadoClass = (estado) => {
    switch (Number(estado)) {
      case 1: return 'bg-success';
      case 2: return 'bg-danger';
      case 3: return 'bg-warning text-dark';
      case 4: return 'bg-info text-dark';
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
    const { usuarios, filtro, viewUser, editUser, newRole, newEstado } = this.state;
    const texto = filtro.toLowerCase();
    const filtrados = usuarios.filter(u =>
      this.safe(u.nombre).includes(texto) ||
      this.safe(u.apellido_paterno).includes(texto) ||
      this.safe(u.apellido_materno).includes(texto) ||
      this.safe(u.correo).includes(texto) ||
      this.safe(u.rol).includes(texto)
    );

    return (
      <div className="listar-usuarios-container">
        <div className="card listar-usuarios-card p-4">
          <h3 className="mb-4">Listado de Usuarios</h3>
          
          <div className="mb-4 filter-container">
            <Search className="filter-icon" size={18} />
            <input
              type="text"
              placeholder="Filtrar usuarios..."
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
                  <th>Rol</th>
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
                    <td>{u.rol}</td>
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
                    <td colSpan="5" className="text-center py-5">No hay usuarios que coincidan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Modal */}
        {viewUser && (
          <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Datos de Usuario</h5>
                  <button type="button" className="btn-close" onClick={this.closeViewModal}></button>
                </div>
                <div className="modal-body">
                  <p><strong>Nombre:</strong> {viewUser.nombre} {viewUser.apellido_paterno} {viewUser.apellido_materno}</p>
                  <p><strong>Teléfono:</strong> {viewUser.telefono}</p>
                  <p><strong>CI:</strong> {viewUser.carnet_identidad}</p>
                  <p><strong>Correo:</strong> {viewUser.correo}</p>
                  <p><strong>Rol:</strong> {viewUser.rol}</p>
                  <p><strong>Estado:</strong> {this.renderEstado(viewUser.estado)}</p>
                  <p><strong>Fecha Nac.:</strong> {new Date(viewUser.fecha_nacimiento).toLocaleDateString('es-BO')}</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={this.closeViewModal}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editUser && (
          <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Modificar Usuario</h5>
                  <button type="button" className="btn-close" onClick={this.closeEditModal}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Rol</label>
                    <select name="newRole" value={newRole} onChange={this.handleEditChange} className="form-select">
                      <option value="estudiante">Estudiante</option>
                      <option value="docente">Docente</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Estado</label>
                    <select name="newEstado" value={newEstado} onChange={this.handleEditChange} className="form-select">
                      <option value="1">Habilitado</option>
                      <option value="2">Deshabilitado</option>
                      <option value="3">Habilitado con Observacion</option>
                      <option value="4">Deudas Pendientes</option>
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

export default ListarUsuarios;
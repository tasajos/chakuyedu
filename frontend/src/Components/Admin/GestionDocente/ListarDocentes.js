import React, { Component } from 'react';
import axios from 'axios';
import { Eye, Edit2 } from 'lucide-react';
import '../../../Styles/Admin/ListarUsuarios.css';

class ListarDocentes extends Component {
  state = {
    usuarios: [],
    filtro: '',
    viewUser: null,
    editUser: null,
    newRole: '',
    newEstado: ''
  };

  async componentDidMount() {
    try {
      const res = await axios.get('http://localhost:5002/api/usuarios');
      this.setState({ usuarios: res.data });
    } catch (err) {
      console.error('Error al obtener docentes:', err);
    }
  }

  handleFiltroChange = (e) => {
    this.setState({ filtro: e.target.value });
  }

  safe = (v) => (v || '').toString().toLowerCase();

  openViewModal = (user) => {
    this.setState({ viewUser: user });
  }

  closeViewModal = () => {
    this.setState({ viewUser: null });
  }

  openEditModal = (user) => {
    this.setState({
      editUser: user,
      newRole: user.rol,
      newEstado: (user.estado ?? 1).toString()
    });
  }

  closeEditModal = () => {
    this.setState({ editUser: null });
  }

  handleEditChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  saveEdit = async () => {
    const { editUser, newRole, newEstado } = this.state;
    try {
      await axios.patch(
        `http://localhost:5002/api/usuarios/${editUser.id}`,
        { rol: newRole, estado: Number(newEstado) }
      );
      const res = await axios.get('http://localhost:5002/api/usuarios');
      this.setState({ usuarios: res.data, editUser: null });
    } catch (err) {
      console.error('Error al actualizar docente:', err);
    }
  }

  render() {
    const { usuarios, filtro, viewUser, editUser, newRole, newEstado } = this.state;
    const texto = filtro.toLowerCase();
    const filtrados = usuarios.filter(u =>
      u.rol === 'docente' && (
        this.safe(u.nombre).includes(texto) ||
        this.safe(u.apellido_paterno).includes(texto) ||
        this.safe(u.apellido_materno).includes(texto) ||
        this.safe(u.telefono).includes(texto) ||
        this.safe(u.ci).includes(texto) ||
        this.safe(u.correo).includes(texto)
      )
    );

    return (
      <>
  
        <div className="dashboard-layout">
       

          <main className="main-content listar-usuarios-container">
            <div className="card listar-usuarios-card p-4">
              <h3 className="mb-4">Listado de Docentes</h3>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Filtrar por nombre, apellidos, CI o correo..."
                  className="form-control"
                  value={filtro}
                  onChange={this.handleFiltroChange}
                />
              </div>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-primary">
                    <tr>
                      <th>Nombre</th>
                      <th>Apellido Paterno</th>
                      <th>Apellido Materno</th>
                      <th>Teléfono</th>
                      <th>CI</th>
                      <th>Correo</th>
                      <th>Estado</th>
                      <th>Fecha Nac.</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map(u => (
                      <tr key={u.id}>
                        <td>{u.nombre}</td>
                        <td>{u.apellido_paterno}</td>
                        <td>{u.apellido_materno}</td>
                        <td>{u.telefono}</td>
                        <td>{u.ci}</td>
                        <td>{u.correo}</td>
                        <td>{u.estado === 1 ? 'Habilitado' : 'Deshabilitado'}</td>
                        <td>{new Date(u.fecha_nacimiento).toLocaleDateString('es-BO')}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-info me-2" onClick={() => this.openViewModal(u)}>
                            <Eye size={16} /> Ver
                          </button>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => this.openEditModal(u)}>
                            <Edit2 size={16} /> Modificar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtrados.length === 0 && (
                      <tr>
                        <td colSpan="9" className="text-center">No hay docentes que coincidan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        {/* Modales idénticos a ListarUsuarios */}
        {viewUser && (
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Datos del Docente</h5>
                  <button type="button" className="btn-close" onClick={this.closeViewModal}></button>
                </div>
                <div className="modal-body">
                  <p><strong>Nombre:</strong> {viewUser.nombre} {viewUser.apellido_paterno} {viewUser.apellido_materno}</p>
                  <p><strong>Teléfono:</strong> {viewUser.telefono}</p>
                  <p><strong>CI:</strong> {viewUser.ci}</p>
                  <p><strong>Correo:</strong> {viewUser.correo}</p>
                  <p><strong>Estado:</strong> {viewUser.estado === 1 ? 'Habilitado' : 'Deshabilitado'}</p>
                  <p><strong>Fecha Nac.:</strong> {new Date(viewUser.fecha_nacimiento).toLocaleDateString('es-BO')}</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={this.closeViewModal}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editUser && (
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Modificar Docente</h5>
                  <button type="button" className="btn-close" onClick={this.closeEditModal}></button>
                </div>
                <div className="modal-body">
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
      </>
    );
  }
}

export default ListarDocentes;

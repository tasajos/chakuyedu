// frontend/src/Components/Admin/GestionDocente/ListarDocentes.js
import React, { Component } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Eye } from 'lucide-react';

import '../../../Styles/Admin/ListarUsuarios.css';

class ListarDocentes extends Component {
  state = {
    docentes: [],
    filtro: '',
    viewDocente: null,
    editDocente: null,
    newEstado: ''
  };

  async componentDidMount() {
    await this.fetchDocentes();
  }

  fetchDocentes = async () => {
    try {
      const q = query(
        collection(db, 'usuarios'),
        where('rol', '==', 'docente')
      );
      const snap = await getDocs(q);
      const docentes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.setState({ docentes });
    } catch (err) {
      console.error('Error fetching docentes:', err);
    }
  }

  handleFiltroChange = (e) => this.setState({ filtro: e.target.value });

  safe = (v) => (v || '').toString().toLowerCase();

  openViewModal = (docente) => this.setState({ viewDocente: docente });
  closeViewModal = () => this.setState({ viewDocente: null });

  openEditModal = (docente) => this.setState({
    editDocente: docente,
    newEstado: (docente.estado ?? 1).toString()
  });
  closeEditModal = () => this.setState({ editDocente: null });

  handleEstadoChange = (e) => this.setState({ newEstado: e.target.value });

  saveEdit = async () => {
    const { editDocente, newEstado } = this.state;
    try {
      const ref = doc(db, 'usuarios', editDocente.id);
      await updateDoc(ref, { estado: Number(newEstado) });
      this.closeEditModal();
      await this.fetchDocentes();
    } catch (err) {
      console.error('Error updating docente:', err);
    }
  }

  render() {
    const { docentes, filtro, viewDocente, editDocente, newEstado } = this.state;
    const texto = filtro.toLowerCase();
    const filtrados = docentes.filter(d =>
      this.safe(d.nombre).includes(texto) ||
      this.safe(d.apellido_paterno).includes(texto) ||
      this.safe(d.apellido_materno).includes(texto) ||
      this.safe(d.telefono).includes(texto) ||
      this.safe(d.carnet_identidad).includes(texto) ||
      this.safe(d.correo).includes(texto)
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
                  placeholder="Filtrar docentes..."
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
                    {filtrados.map(d => (
                      <tr key={d.id}>
                        <td>{d.nombre}</td>
                        <td>{d.apellido_paterno}</td>
                        <td>{d.apellido_materno}</td>
                        <td>{d.telefono}</td>
                        <td>{d.carnet_identidad}</td>
                        <td>{d.correo}</td>
                        <td>{d.estado === 1 ? 'Habilitado' : 'Deshabilitado'}</td>
                        <td>{new Date(d.fecha_nacimiento).toLocaleDateString('es-BO')}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-info me-2"
                            onClick={() => this.openViewModal(d)}
                          >
                            <Eye size={16} /> Ver
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => this.openEditModal(d)}
                          >
                            Estado
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

        {viewDocente && (
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Datos del Docente</h5>
                  <button type="button" className="btn-close" onClick={this.closeViewModal}></button>
                </div>
                <div className="modal-body">
                  <p><strong>Nombre:</strong> {viewDocente.nombre} {viewDocente.apellido_paterno} {viewDocente.apellido_materno}</p>
                  <p><strong>Teléfono:</strong> {viewDocente.telefono}</p>
                  <p><strong>CI:</strong> {viewDocente.carnet_identidad}</p>
                  <p><strong>Correo:</strong> {viewDocente.correo}</p>
                  <p><strong>Estado:</strong> {viewDocente.estado === 1 ? 'Habilitado' : 'Deshabilitado'}</p>
                  <p><strong>Fecha Nac.:</strong> {new Date(viewDocente.fecha_nacimiento).toLocaleDateString('es-BO')}</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={this.closeViewModal}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editDocente && (
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Modificar Estado</h5>
                  <button type="button" className="btn-close" onClick={this.closeEditModal}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Estado</label>
                    <select name="newEstado" value={newEstado} onChange={this.handleEstadoChange} className="form-select">
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

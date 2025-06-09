import React, { Component } from 'react';
import axios from 'axios';
import '../../../Styles/Admin/ListarUsuarios.css';

class ListarUsuarios extends Component {
  state = {
    usuarios: [],
    filtro: ''
  };

  async componentDidMount() {
    try {
      const res = await axios.get('http://localhost:5002/api/usuarios');
      this.setState({ usuarios: res.data });
    } catch (err) {
      console.error(err);
    }
  }

  handleFiltroChange = (e) => {
    this.setState({ filtro: e.target.value });
  }

  render() {
    const { usuarios, filtro } = this.state;
    const texto = filtro.toLowerCase();
    const filtrados = usuarios.filter(u =>
      u.nombre.toLowerCase().includes(texto) ||
      u.apellido_paterno.toLowerCase().includes(texto) ||
      u.apellido_materno.toLowerCase().includes(texto) ||
      u.ci.toLowerCase().includes(texto) ||
      u.correo.toLowerCase().includes(texto) ||
      u.rol.toLowerCase().includes(texto)
    );

    return (
      <>
       
        <div className="dashboard-layout">
         
          <main className="main-content listar-usuarios-container">
            <div className="card listar-usuarios-card p-4">
              <h3 className="mb-4">Listado de Usuarios</h3>

              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Filtrar por nombre, apellidos, CI o rol..."
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
                      <th>Rol</th>
                      <th>Fecha de Nacimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((u, idx) => (
                      <tr key={idx}>
                        <td>{u.nombre}</td>
                        <td>{u.apellido_paterno}</td>
                        <td>{u.apellido_materno}</td>
                        <td>{u.telefono}</td>
                        <td>{u.correo}</td>
                        <td>{u.ci}</td>
                        <td>{u.rol}</td>
                        <td>{new Date(u.fecha_nacimiento).toLocaleDateString('es-BO')}</td>
                      </tr>
                    ))}
                    {filtrados.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center">No hay usuarios que coincidan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
}

export default ListarUsuarios;

import React, { Component } from 'react';
import axios from 'axios';

import '../../../Styles/Admin/CrearDocente.css';

class CrearDocente extends Component {
  state = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    carnet_identidad: '',
    correo: '',
    fecha_nacimiento: '',
    mensaje: ''
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
    if (name === 'carnet_identidad') {
      this.setState({ contrasena: value });
    }
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    const {
      nombre, apellido_paterno, apellido_materno,
      telefono, carnet_identidad, correo, fecha_nacimiento
    } = this.state;

    try {
      const res = await axios.post('http://localhost:5002/api/usuarios/crear', {
        nombre,
        apellido_paterno,
        apellido_materno,
        telefono,
        rol: 'docente',
        carnet_identidad,
        correo,
        contrasena: carnet_identidad,
        fecha_nacimiento
      });

      this.setState({
        mensaje: res.data.mensaje,
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        telefono: '',
        carnet_identidad: '',
        correo: '',
        fecha_nacimiento: ''
      });
    } catch (err) {
      console.error(err);
      this.setState({ mensaje: 'Error al crear docente' });
    }
  }

  render() {
    const {
      nombre, apellido_paterno, apellido_materno,
      telefono, carnet_identidad, correo, fecha_nacimiento, mensaje
    } = this.state;

    return (
      <>

        <div className="dashboard-layout">
      

          <main className="main-content crear-docente-container">
            <div className="card crear-docente-card p-4">
              <h3 className="mb-4 text-center">Crear Docente</h3>
              <form onSubmit={this.handleSubmit}>
                <div className="row gx-3 mb-3">
                  <div className="col-md-6">
                    <label>Nombre</label>
                    <input
                      type="text"
                      name="nombre"
                      value={nombre}
                      onChange={this.handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Apellido Paterno</label>
                    <input
                      type="text"
                      name="apellido_paterno"
                      value={apellido_paterno}
                      onChange={this.handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="row gx-3 mb-3">
                  <div className="col-md-6">
                    <label>Apellido Materno</label>
                    <input
                      type="text"
                      name="apellido_materno"
                      value={apellido_materno}
                      onChange={this.handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={telefono}
                      onChange={this.handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="row gx-3 mb-3">
                  <div className="col-md-6">
                    <label>Carnet de Identidad</label>
                    <input
                      type="text"
                      name="carnet_identidad"
                      value={carnet_identidad}
                      onChange={this.handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Correo</label>
                    <input
                      type="email"
                      name="correo"
                      value={correo}
                      onChange={this.handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="row gx-3 mb-4">
                  <div className="col-md-6">
                    <label>Fecha de Nacimiento</label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={fecha_nacimiento}
                      onChange={this.handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      name="contrasena"
                      value={carnet_identidad}
                      className="form-control"
                      disabled
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Guardar Docente
                </button>
              </form>

              {mensaje && (
                <div className="alert alert-info mt-3 text-center">
                  {mensaje}
                </div>
              )}
            </div>
          </main>
        </div>
      </>
    );
  }
}

export default CrearDocente;

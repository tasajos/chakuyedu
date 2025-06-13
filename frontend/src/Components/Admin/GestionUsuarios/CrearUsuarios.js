// frontend/src/components/CrearUsuario.js
import React, { Component } from 'react';
import { auth, db } from '../../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import '../../../Styles/Admin/CrearUsuarios.css';

class CrearUsuario extends Component {
  state = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    rol: 'estudiante',
    carnet_identidad: '',
    correo: '',
    contrasena: '',
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
      nombre,
      apellido_paterno,
      apellido_materno,
      telefono,
      rol,
      carnet_identidad,
      correo,
      contrasena,
      fecha_nacimiento
    } = this.state;

    try {
      // 1. Crear usuario en Firebase Auth
      const userCred = await createUserWithEmailAndPassword(
        auth,
        correo,
        contrasena
      );
      const uid = userCred.user.uid;

      // 2. Guardar perfil en Firestore en colección "usuarios"
      await setDoc(
        doc(db, 'usuarios', uid),
        {
          nombre,
          apellido_paterno,
          apellido_materno,
          telefono,
          rol,
          carnet_identidad,
          correo,
          fecha_nacimiento,
          estado: 1,
          createdAt: serverTimestamp()
        }
      );

      this.setState({
        mensaje: 'Usuario creado correctamente',
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        telefono: '',
        rol: 'estudiante',
        carnet_identidad: '',
        correo: '',
        contrasena: '',
        fecha_nacimiento: ''
      });
    } catch (error) {
      console.error('Error al crear usuario en Firebase:', error);
      this.setState({ mensaje: 'Error al crear usuario: ' + error.message });
    }
  }

  render() {
    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      telefono,
      rol,
      carnet_identidad,
      correo,
      fecha_nacimiento,
      mensaje
    } = this.state;

    return (
      <div className="crear-usuario-container">
        <div className="card crear-usuario-card p-4">
          <h3 className="mb-4 text-center">Registrar Usuario</h3>
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
                <label>Rol</label>
                <select
                  name="rol"
                  value={rol}
                  onChange={this.handleChange}
                  className="form-select"
                  required
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
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
            </div>

            <div className="row gx-3 mb-3">
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
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Guardar Usuario
            </button>
          </form>

          {mensaje && (
            <div className="alert alert-info mt-3 text-center">{mensaje}</div>
          )}
        </div>
      </div>
    );
  }
}

export default CrearUsuario;

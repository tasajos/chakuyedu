import React, { Component } from 'react';
import axios from 'axios';
import '../Styles/Login.css';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      correo: '',
      contrasena: '',
      mensaje: '',
      usuario: null
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }
handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post('http://localhost:5002/api/auth/login', {
      correo: this.state.correo,
      contrasena: this.state.contrasena
    });

    const usuario = res.data.usuario;

    // 1. Guardar en localStorage
    localStorage.setItem('usuario', JSON.stringify(usuario));

    // 2. Redirigir según el rol
    switch (usuario.rol) {
      case 'admin':
        window.location.href = '/admin';
        break;
      case 'docente':
        window.location.href = '/docente';
        break;
      case 'estudiante':
        window.location.href = '/estudiante';
        break;
      default:
        this.setState({ mensaje: 'Rol desconocido' });
    }
  } catch (error) {
    this.setState({ mensaje: 'Error: Credenciales incorrectas' });
  }
}


  render() {
    return (
      <div className="login-container">
        <div className="login-card shadow-lg p-4">
          <h3 className="mb-4 text-center">Iniciar Sesión</h3>
          <form onSubmit={this.handleSubmit}>
            <div className="form-group mb-3">
              <label>Email</label>
              <input
                type="email"
                name="correo"
                className="form-control"
                value={this.state.correo}
                onChange={this.handleChange}
                required
              />
            </div>
            <div className="form-group mb-3">
              <label>Contraseña</label>
              <input
                type="password"
                name="contrasena"
                className="form-control"
                value={this.state.contrasena}
                onChange={this.handleChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Entrar</button>
          </form>

          {this.state.mensaje && (
            <div className="alert alert-info mt-3 text-center">{this.state.mensaje}</div>
          )}
        </div>
      </div>
    );
  }
}

export default Login;

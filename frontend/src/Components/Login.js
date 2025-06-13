// frontend/src/Components/Login.js
import React, { Component } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import '../Styles/Login.css';
import loginIcon from '../assets/logocha.png';

class Login extends Component {
  state = {
    correo: '',
    contrasena: '',
    mensaje: ''
  };

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    const { correo, contrasena } = this.state;
    this.setState({ mensaje: '' });

    try {
      // 1) Autenticar con Firebase Auth
      await signInWithEmailAndPassword(auth, correo, contrasena);

      // 2) Buscar el perfil en Firestore por correo
      const usuariosCol = collection(db, 'usuarios');
      const q = query(usuariosCol, where('correo', '==', correo));
      const snap = await getDocs(q);

      if (snap.empty) {
        this.setState({ mensaje: 'Usuario no registrado en Firestore.' });
        return;
      }

      // Tomamos el primer documento que coincida
      const userDoc = snap.docs[0];
      const perfil  = userDoc.data();
      const uidFire = userDoc.id;

      // 3) Guardar en localStorage
      localStorage.setItem('usuario', JSON.stringify({ uid: uidFire, ...perfil }));

      // 4) Redirigir según rol
      switch (perfil.rol) {
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
          this.setState({ mensaje: 'Rol desconocido en perfil.' });
      }

    } catch (error) {
      console.error('Error en login:', error);
      this.setState({ mensaje: 'Credenciales incorrectas.' });
    }
  }

  render() {
    const { correo, contrasena, mensaje } = this.state;
    return (
      <div className="login-container">
        <div className="login-card shadow-lg p-4">

          <div className="text-center">
            <img src={loginIcon} alt="Login Icon" className="login-icon mb-4" />
          </div>
          <h3 className="mb-4 text-center">Login</h3>
          <form onSubmit={this.handleSubmit} noValidate>
            <div className="form-group mb-3">
              <label>Email</label>
              <input
                type="email"
                name="correo"
                className="form-control"
                value={correo}
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
                value={contrasena}
                onChange={this.handleChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Entrar</button>
          </form>
          {mensaje && (
            <div className="alert alert-danger mt-3 text-center">{mensaje}</div>
          )}
        </div>
      </div>
    );
  }
}

export default Login;

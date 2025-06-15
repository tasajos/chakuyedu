import React, { Component } from 'react';
// Se añade useNavigate para una redirección más fluida (sin recargar la página)
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Usaremos getDoc para una lectura directa
import { auth, db } from '../firebase';
import '../Styles/Login.css';
import loginIcon from '../assets/logocha.png';

class Login extends Component {
  // === NUEVO ESTADO PARA CONTROLAR LA UI ===
  state = {
    correo: '',
    contrasena: '',
    mensaje: '',
    isLoading: false,   // Para mostrar un estado de "cargando"
    isLoggedIn: false, // Para mostrar el mensaje de bienvenida
  };

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    const { correo, contrasena } = this.state;
    // Activamos el estado de carga y limpiamos mensajes
    this.setState({ mensaje: '', error: null, isLoading: true });

    try {
      // 1) Autenticar y obtener el userCredential
      const userCredential = await signInWithEmailAndPassword(auth, correo, contrasena);
      const user = userCredential.user;

      // 2) === MEJORA DE VELOCIDAD ===
      // Leer el documento del usuario directamente por su ID (uid)
      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        this.setState({ mensaje: 'Error: El perfil de usuario no existe en la base de datos.', isLoading: false });
        // Opcional: desloguear al usuario si su perfil no se encuentra
        // auth.signOut();
        return;
      }

      const perfil = userDocSnap.data();
      
      // 3) === MEJORA DE EXPERIENCIA DE USUARIO ===
      // Guardar en localStorage y mostrar mensaje de bienvenida
      localStorage.setItem('usuario', JSON.stringify({ uid: user.uid, ...perfil }));
      
      const welcomeMsg = `¡Bienvenido/a, ${perfil.nombre} (${perfil.rol})!`;
      this.setState({ isLoggedIn: true, mensaje: welcomeMsg, isLoading: false });

      // 4) Redirigir después de un breve momento
      setTimeout(() => {
        const { navigate } = this.props; // Usamos el hook de navegación inyectado
        switch (perfil.rol) {
          case 'admin':
            navigate('/admin/');
            break;
          case 'docente':
            navigate('/docente/'); // Redirigir a una página específica
            break;
          case 'estudiante':
            navigate('/estudiante/'); // Redirigir a una página específica
            break;
          default:
            this.setState({ mensaje: 'Rol desconocido.', isLoggedIn: false });
        }
      }, 2000); // Espera de 2 segundos

    } catch (error) {
      console.error('Error en login:', error);
      let errorMsg = 'Credenciales incorrectas o el usuario no existe.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          errorMsg = 'El correo o la contraseña son incorrectos.';
      }
      this.setState({ mensaje: errorMsg, isLoading: false });
    }
  }

  render() {
    const { correo, contrasena, mensaje, isLoading, isLoggedIn } = this.state;

    return (
      <div className="login-container">
        <div className="login-card shadow-lg p-4">
          <div className="text-center">
            <img src={loginIcon} alt="Login Icon" className="login-icon mb-4" />
          </div>
          
          {/* Renderizado condicional: Muestra bienvenida o el formulario */}
          {isLoggedIn ? (
            <div className="text-center">
              <h3 className="mb-3">Login Exitoso</h3>
              <div className="alert alert-success">{mensaje}</div>
              <p className="text-muted">Serás redirigido en un momento...</p>
              <div className="spinner-border text-primary mt-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <h3 className="mb-4 text-center">Login</h3>
              <form onSubmit={this.handleSubmit} noValidate>
                <div className="form-group mb-3">
                  <label>Email</label>
                  <input
                    type="email" name="correo" className="form-control"
                    value={correo} onChange={this.handleChange} required
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Contraseña</label>
                  <input
                    type="password" name="contrasena" className="form-control"
                    value={contrasena} onChange={this.handleChange} required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span> Verificando...</span>
                    </>
                  ) : 'Entrar'}
                </button>
              </form>
              {mensaje && (
                <div className="alert alert-danger mt-3 text-center">{mensaje}</div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
}

// HOC para inyectar el hook 'useNavigate' en el componente de clase
function LoginConNavegacion(props) {
  const navigate = useNavigate();
  return <Login {...props} navigate={navigate} />;
}

export default LoginConNavegacion;
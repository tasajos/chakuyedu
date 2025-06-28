import React, { Component } from 'react';
import { getAuth, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import SidebarMenu from '../../SidebarMenu';
import { Link } from 'react-router-dom';
import { BookCopy, ClipboardList, User, KeyRound, FileSignature } from 'lucide-react';
import '../../../Styles/Estudiante/PerfilEstudiante.css';

class PerfilEstudiante extends Component {
  state = {
    // Datos del perfil
    estudianteData: null,
    stats: {
      materiasInscritas: 0,
      tareasPendientes: 0,
      examenesPendientes: 0, // Nuevo
    },
    // Formulario de contraseña
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    // Estado de la UI
    loading: true,
    isSaving: false,
    mensaje: '',
    error: '',
    currentUser: null,
  };

  authSubscription = null;

  componentDidMount() {
    const auth = getAuth();
    this.authSubscription = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setState({ currentUser: user });
        this.loadProfileData(user.uid);
      } else {
        this.setState({ loading: false, error: 'Debe iniciar sesión.' });
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }

  loadProfileData = async (estudianteId) => {
    try {
      // 1. Obtener datos del usuario, sus materias y sus tareas pendientes en paralelo
      const [userDocSnap, emSnap, etSnap,eeSnap] = await Promise.all([
        getDoc(doc(db, 'usuarios', estudianteId)),
        getDocs(query(collection(db, 'estudiante_materia'), where('estudiante_id', '==', estudianteId))),
        getDocs(query(collection(db, 'estudiante_tarea'), where('estudiante_id', '==', estudianteId), where('estado', '==', 'pendiente'))),
        getDocs(query(collection(db, 'estudiante_examen'), where('estudiante_id', '==', estudianteId), where('estado', '==', 'pendiente'))) // Nueva consulta
      ]);

      if (userDocSnap.exists()) {
        this.setState({ estudianteData: userDocSnap.data() });
      }

      const materiasInscritas = emSnap.size;
      const tareasPendientes = etSnap.size;
      const examenesPendientes = eeSnap.size; // Obtenemos el nuevo dato
      this.setState({ stats: { materiasInscritas, tareasPendientes,examenesPendientes }, loading: false });

    } catch (error) {
      console.error("Error cargando datos del perfil:", error);
      this.setState({ error: 'No se pudo cargar la información del perfil.', loading: false });
    }
  }

  handleInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleChangePassword = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword, currentUser } = this.state;

    if (newPassword !== confirmPassword) {
      this.setState({ error: 'Las nuevas contraseñas no coinciden.', mensaje: '' });
      return;
    }
    if (newPassword.length < 6) {
      this.setState({ error: 'La nueva contraseña debe tener al menos 6 caracteres.', mensaje: '' });
      return;
    }

    this.setState({ isSaving: true, mensaje: '', error: '' });

    try {
      // Reautenticar por seguridad
      const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Actualizar la contraseña en Firebase Auth
      await updatePassword(currentUser, newPassword);

      this.setState({
        mensaje: '¡Contraseña actualizada correctamente!',
        error: '',
        isSaving: false,
        oldPassword: '', newPassword: '', confirmPassword: ''
      });

    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      let errorMsg = 'Ocurrió un error. Intente de nuevo.';
      if (error.code === 'auth/wrong-password') {
        errorMsg = 'La contraseña actual es incorrecta.';
      }
      this.setState({ error: errorMsg, mensaje: '', isSaving: false });
    }
  }

  render() {
    const { loading, estudianteData, stats, oldPassword, newPassword, confirmPassword, isSaving, mensaje, error } = this.state;

    if (loading) {
      return <div className="dashboard-layout"><SidebarMenu /><main className="main-content p-4"><p>Cargando perfil...</p></main></div>;
    }

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Mi Perfil de Estudiante</h3>
            
            <div className="row mb-4">
                   <div className="col-lg-4 col-md-6 mb-4">
              <div className="stat-card h-100">
                  <BookCopy size={40} className="text-primary" />
                   <div>
                    <span className="stat-value">{stats.materiasInscritas}</span>
                    <span className="stat-label">Materias Inscritas</span>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 mb-4">
                <div className="stat-card h-100">
                  <ClipboardList size={40} className="text-danger" />
                  <div>
                    <span className="stat-value">{stats.tareasPendientes}</span>
                    <span className="stat-label">Tareas Pendientes</span>
                  </div>               
                </div>  
              </div>
{/* Nueva tarjeta para exámenes */}
              <div className="col-lg-4 col-md-12 mb-4">
                <Link to="/Estudiante/Examenes/EstudianteExamenes" className="text-decoration-none">
                  <div className="stat-card h-100 linkable">
                    <FileSignature size={40} className="text-warning" />
                    <div>
                      <span className="stat-value">{stats.examenesPendientes}</span>
                      <span className="stat-label">Exámenes Pendientes</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
            
         

            <div className="row">
              <div className="col-lg-6 mb-4">
                <div className="card shadow-sm h-100">
                  <div className="card-header"><User size={18} className="me-2"/>Mis Datos Personales</div>
                  <div className="card-body">
                    {estudianteData ? (
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item"><strong>Nombre:</strong> {estudianteData.nombre}</li>
                        <li className="list-group-item"><strong>Apellidos:</strong> {`${estudianteData.apellido_paterno} ${estudianteData.apellido_materno}`}</li>
                        <li className="list-group-item"><strong>Teléfono:</strong> {estudianteData.telefono}</li>
                        <li className="list-group-item"><strong>Email:</strong> {estudianteData.correo}</li>
                      </ul>
                    ) : <p>No se pudieron cargar los datos.</p>}
                  </div>
                </div>
              </div>
              <div className="col-lg-6 mb-4">
                <div className="card shadow-sm h-100">
                  <div className="card-header"><KeyRound size={18} className="me-2"/>Cambiar Contraseña</div>
                  <div className="card-body">
                    <form onSubmit={this.handleChangePassword}>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="oldPass">Contraseña Actual</label>
                        <input type="password" id="oldPass" name="oldPassword" value={oldPassword} onChange={this.handleInputChange} className="form-control" required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="newPass">Nueva Contraseña</label>
                        <input type="password" id="newPass" name="newPassword" value={newPassword} onChange={this.handleInputChange} className="form-control" required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="confirmPass">Confirmar Nueva Contraseña</label>
                        <input type="password" id="confirmPass" name="confirmPassword" value={confirmPassword} onChange={this.handleInputChange} className="form-control" required />
                      </div>
                      {mensaje && <div className="alert alert-success">{mensaje}</div>}
                      {error && <div className="alert alert-danger">{error}</div>}
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default PerfilEstudiante;
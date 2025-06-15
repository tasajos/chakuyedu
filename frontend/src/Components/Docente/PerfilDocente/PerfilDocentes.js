import React, { Component } from 'react';
import { getAuth, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import SidebarMenu from '../../SidebarMenu';
import { BookUp, Users, User, KeyRound } from 'lucide-react';
import '../../../Styles/Docente/PerfilDocente.css';

class PerfilDocente extends Component {
  state = {
    // Datos del perfil
    docenteData: null,
    stats: {
      materiasCount: 0,
      estudiantesCount: 0,
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

  loadProfileData = async (docenteId) => {
    try {
      // 1. Obtener datos del usuario y materias en paralelo
      const [userDocSnap, dmSnap] = await Promise.all([
        getDoc(doc(db, 'usuarios', docenteId)),
        getDocs(query(collection(db, 'docente_materia'), where('docente_id', '==', docenteId)))
      ]);

      if (userDocSnap.exists()) {
        this.setState({ docenteData: userDocSnap.data() });
      }

      const materiasIds = dmSnap.docs.map(d => d.data().materia_id);
      const materiasCount = materiasIds.length;

      // 2. Calcular estudiantes únicos
      let estudiantesCount = 0;
      if (materiasCount > 0) {
        const emQuery = query(collection(db, 'estudiante_materia'), where('materia_id', 'in', materiasIds));
        const emSnap = await getDocs(emQuery);
        const estudianteIds = new Set(emSnap.docs.map(d => d.data().estudiante_id));
        estudiantesCount = estudianteIds.size;
      }

      this.setState({ stats: { materiasCount, estudiantesCount }, loading: false });

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
      // 1. Reautenticar al usuario por seguridad
      const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. Si la reautenticación es exitosa, actualizar la contraseña
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
    const { loading, docenteData, stats, oldPassword, newPassword, confirmPassword, isSaving, mensaje, error } = this.state;

    if (loading) {
      return <div className="dashboard-layout"><SidebarMenu /><main className="main-content p-4"><p>Cargando perfil...</p></main></div>;
    }

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Perfil del Docente</h3>
            
            {/* Sección de Estadísticas */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="stat-card">
                  <BookUp size={40} className="text-primary" />
                  <div>
                    <span className="stat-value">{stats.materiasCount}</span>
                    <span className="stat-label">Materias Asignadas</span>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="stat-card">
                  <Users size={40} className="text-success" />
                  <div>
                    <span className="stat-value">{stats.estudiantesCount}</span>
                    <span className="stat-label">Estudiantes Únicos</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              {/* Sección de Datos Personales */}
              <div className="col-lg-6 mb-4">
                <div className="card shadow-sm h-100">
                  <div className="card-header"><User size={18} className="me-2"/>Datos Personales</div>
                  <div className="card-body">
                    {docenteData ? (
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item"><strong>Nombre:</strong> {docenteData.nombre}</li>
                        <li className="list-group-item"><strong>Apellido Paterno:</strong> {docenteData.apellido_paterno}</li>
                        <li className="list-group-item"><strong>Apellido Materno:</strong> {docenteData.apellido_materno}</li>
                        <li className="list-group-item"><strong>Teléfono:</strong> {docenteData.telefono}</li>
                        <li className="list-group-item"><strong>Email:</strong> {docenteData.correo}</li>
                      </ul>
                    ) : <p>No se pudieron cargar los datos.</p>}
                  </div>
                </div>
              </div>

              {/* Sección para Cambiar Contraseña */}
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

export default PerfilDocente;
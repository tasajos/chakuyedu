import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useParams, useNavigate } from 'react-router-dom';

import SidebarMenu from '../../SidebarMenu';
// Reutilizamos el CSS de AsignarTarea ya que el layout es idéntico
import '../../../Styles/Docente/AsignarTarea.css';

class CrearExamen extends Component {
  // Estado adaptado para un examen
  state = {
    materia: null,
    currentUser: null,
    titulo: '',
    descripcion: '',
    fechaExamen: '',
    duracionMinutos: '',
    puntajeTotal: 100, // Puntaje por defecto
    saving: false, 
    error: '',
    success: '',
  };

  authSubscription = null;

  componentDidMount() {
    const auth = getAuth();
    this.authSubscription = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setState({ currentUser: user });
        this.fetchMateria();
      } else {
        this.props.navigate('/login');
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }

  fetchMateria = async () => {
    const { materiaId } = this.props.params;
    const matRef = doc(db, 'materias', materiaId);
    const matSnap = await getDoc(matRef);
    if (matSnap.exists()) {
      this.setState({ materia: matSnap.data() });
    } else {
      this.setState({ error: 'Materia no encontrada.' });
    }
  }

  handleInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { titulo, fechaExamen, duracionMinutos } = this.state;
    if (!titulo || !fechaExamen || !duracionMinutos) {
      this.setState({ error: 'Por favor, complete todos los campos obligatorios.' });
      return;
    }
    this.saveExamenToFirestore();
  }

  saveExamenToFirestore = async () => {
    const { titulo, descripcion, fechaExamen, duracionMinutos, puntajeTotal, currentUser } = this.state;
    const { materiaId } = this.props.params;

    this.setState({ saving: true, error: '', success: '' });

    try {
      // Guardamos en la nueva colección 'examenes'
      await addDoc(collection(db, 'examenes'), {
        titulo,
        descripcion: descripcion || '',
        fecha_examen: fechaExamen,
        duracion_minutos: Number(duracionMinutos),
        puntaje_total: Number(puntajeTotal),
        materia_id: materiaId,
        docente_id: currentUser.uid,
        createdAt: serverTimestamp()
      });

      this.setState({
        success: '¡Examen creado correctamente!',
        error: '',
        titulo: '',
        descripcion: '',
        fechaExamen: '',
        duracionMinutos: '',
      });
    } catch (e) {
      console.error("Error guardando el examen: ", e);
      this.setState({ error: 'No se pudo guardar el examen.', saving: false });
    } finally {
        this.setState({ saving: false });
    }
  }

  render() {
    const { materia, titulo, descripcion, fechaExamen, duracionMinutos, puntajeTotal, saving, error, success } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <div className="asignar-tarea-container"> {/* Reutilizamos la clase del contenedor */}
              <h3 className="mb-1">Crear Nuevo Examen</h3>
              {materia && <p className="text-muted mb-4">Para la materia de: <strong>{materia.nombre}</strong></p>}
              
              <form onSubmit={this.handleSubmit} className="card shadow-sm p-4">
                <div className="mb-3">
                  <label htmlFor="titulo" className="form-label">Título del Examen</label>
                  <input type="text" className="form-control" id="titulo" name="titulo" value={titulo} onChange={this.handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="descripcion" className="form-label">Instrucciones (Opcional)</label>
                  <textarea className="form-control" id="descripcion" name="descripcion" rows="3" value={descripcion} onChange={this.handleInputChange}></textarea>
                </div>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label htmlFor="fechaExamen" className="form-label">Fecha del Examen</label>
                    <input type="date" className="form-control" id="fechaExamen" name="fechaExamen" value={fechaExamen} onChange={this.handleInputChange} required />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="duracionMinutos" className="form-label">Duración (minutos)</label>
                    <input type="number" className="form-control" id="duracionMinutos" name="duracionMinutos" value={duracionMinutos} onChange={this.handleInputChange} required />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="puntajeTotal" className="form-label">Puntaje Total</label>
                    <input type="number" className="form-control" id="puntajeTotal" name="puntajeTotal" value={puntajeTotal} onChange={this.handleInputChange} required />
                  </div>
                </div>
                
                {error && <div className="alert alert-danger mt-3">{error}</div>}
                {success && <div className="alert alert-success mt-3">{success}</div>}
                
                <button type="submit" className="btn btn-primary mt-3" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Examen'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

// HOC para los hooks de router
function CrearExamenConRouter(props) {
  return <CrearExamen {...props} params={useParams()} navigate={useNavigate()} />;
}

export default CrearExamenConRouter;
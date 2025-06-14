import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
// SE ELIMINARON LAS IMPORTACIONES DE FIREBASE/STORAGE
import { db } from '../../../firebase';
import { useParams, useNavigate } from 'react-router-dom';

import SidebarMenu from '../../SidebarMenu';
import '../../../Styles/Docente/AsignarTarea.css';

class AsignarTarea extends Component {
  // 1. STATE SIMPLIFICADO: Se quitan 'archivo', 'uploading' y 'progress'
  state = {
    materia: null,
    currentUser: null,
    titulo: '',
    descripcion: '',
    fechaEntrega: '',
    enlace: '',
    // 'uploading' ahora solo significa "guardando en Firestore"
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

  // 2. SE ELIMINA EL MÉTODO handleFileChange

  // 3. SE SIMPLIFICA handleSubmit
  handleSubmit = (e) => {
    e.preventDefault();
    const { titulo, descripcion, fechaEntrega } = this.state;
    if (!titulo || !descripcion || !fechaEntrega) {
      this.setState({ error: 'Por favor, complete todos los campos obligatorios.' });
      return;
    }
    // Llama directamente a guardar en Firestore
    this.saveTaskToFirestore();
  }

  // 4. SE ELIMINA EL MÉTODO handleUpload

  // 5. SE SIMPLIFICA saveTaskToFirestore
  saveTaskToFirestore = async () => {
    const { titulo, descripcion, fechaEntrega, enlace, currentUser } = this.state;
    const { materiaId } = this.props.params;

    this.setState({ saving: true, error: '', success: '' });

    try {
      await addDoc(collection(db, 'tareas'), {
        titulo,
        descripcion,
        fecha_entrega: fechaEntrega,
        enlace: enlace || '',
        // El campo 'archivo_url' ya no se incluye
        materia_id: materiaId,
        docente_id: currentUser.uid,
        createdAt: serverTimestamp()
      });

      this.setState({
        success: '¡Tarea asignada correctamente!',
        error: '',
        titulo: '',
        descripcion: '',
        fechaEntrega: '',
        enlace: '',
        saving: false,
      });
    } catch (e) {
      console.error("Error guardando la tarea: ", e);
      this.setState({ error: 'No se pudo guardar la tarea.', saving: false });
    }
  }

  render() {
    // 6. Se quitan 'uploading' y 'progress' de las variables del render
    const { materia, titulo, descripcion, fechaEntrega, enlace, saving, error, success } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <div className="asignar-tarea-container">
              <h3 className="mb-1">Asignar Nueva Tarea</h3>
              {materia && <p className="text-muted mb-4">Para la materia de: <strong>{materia.nombre}</strong></p>}
              
              <form onSubmit={this.handleSubmit} className="card shadow-sm p-4">
                <div className="mb-3">
                  <label htmlFor="titulo" className="form-label">Título de la Tarea</label>
                  <input type="text" className="form-control" id="titulo" name="titulo" value={titulo} onChange={this.handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="descripcion" className="form-label">Descripción / Instrucciones</label>
                  <textarea className="form-control" id="descripcion" name="descripcion" rows="4" value={descripcion} onChange={this.handleInputChange} required></textarea>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="fechaEntrega" className="form-label">Fecha de Entrega</label>
                    <input type="date" className="form-control" id="fechaEntrega" name="fechaEntrega" value={fechaEntrega} onChange={this.handleInputChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="enlace" className="form-label">Enlace Externo (Opcional)</label>
                    <input type="url" className="form-control" id="enlace" name="enlace" placeholder="https://ejemplo.com/recurso" value={enlace} onChange={this.handleInputChange} />
                  </div>
                </div>
                
                {/* 7. SE ELIMINA EL CAMPO DE ARCHIVO Y LA BARRA DE PROGRESO */}
                
                {error && <div className="alert alert-danger mt-3">{error}</div>}
                {success && <div className="alert alert-success mt-3">{success}</div>}
                
                <button type="submit" className="btn btn-primary mt-3" disabled={saving}>
                  {saving ? 'Guardando...' : 'Asignar Tarea'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

// El HOC no necesita cambios
function AsignarTareaConRouter(props) {
  return <AsignarTarea {...props} params={useParams()} navigate={useNavigate()} />;
}

export default AsignarTareaConRouter;
import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import SidebarMenu from '../../SidebarMenu';
import Modal from '../../Utils/Modal';
import { Button } from 'react-bootstrap';
import { ClipboardList, FileSignature } from 'lucide-react';
import '../../../Styles/Estudiante/EstudianteTareas.css';

class EstudianteTareas extends Component {
  state = {
    tareasAgrupadas: {},
    examenesPendientes: [],
    loading: true,
    error: null,
    currentUser: null,
    isModalOpen: false,
    selectedTask: null,
    entregaMetodo: 'drive',
    isSubmitting: false,
  };

  authSubscription = null;

  componentDidMount() {
    const auth = getAuth();
    this.authSubscription = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setState({ currentUser: user });
        this.loadActividades(user.uid); 
      } else {
        this.setState({ loading: false, error: 'Debe iniciar sesión.' });
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }

  loadActividades = async (estudianteId) => {
    this.setState({ loading: true, error: null });
    try {
      const [tareasCompletas, examenesCompletos] = await Promise.all([
        this.fetchTareas(estudianteId),
        this.fetchExamenes(estudianteId)
      ]);

      const tareasAgrupadas = tareasCompletas.reduce((acc, tarea) => {
        const materia = tarea.materiaNombre;
        if (!acc[materia]) {
          acc[materia] = [];
        }
        acc[materia].push(tarea);
        return acc;
      }, {});
      
      this.setState({ 
        tareasAgrupadas, 
        examenesPendientes: examenesCompletos,
        loading: false 
      });
    } catch (error) {
      console.error("Error cargando actividades:", error);
      this.setState({ error: 'No se pudieron cargar tus actividades pendientes.', loading: false });
    }
  }

  fetchTareas = async (estudianteId) => {
    const etQuery = query(collection(db, 'estudiante_tarea'), where('estudiante_id', '==', estudianteId));
    const etSnap = await getDocs(etQuery);
    const tareasPromises = etSnap.docs.map(async (asigDoc) => {
      const asignacion = { id: asigDoc.id, ...asigDoc.data() };
      const tareaSnap = await getDoc(doc(db, 'tareas', asignacion.tarea_id));
      const materiaSnap = await getDoc(doc(db, 'materias', asignacion.materia_id));
      return {
        ...asignacion,
        titulo: tareaSnap.exists() ? tareaSnap.data().titulo : 'Tarea no encontrada',
        fecha_entrega_tarea: tareaSnap.exists() ? tareaSnap.data().fecha_entrega : '',
        materiaNombre: materiaSnap.exists() ? materiaSnap.data().nombre : 'Materia no encontrada',
      };
    });
    return Promise.all(tareasPromises);
  }

  fetchExamenes = async (estudianteId) => {
    const eeQuery = query(collection(db, 'estudiante_examen'), where('estudiante_id', '==', estudianteId), where('estado', '==', 'pendiente'));
    const eeSnap = await getDocs(eeQuery);
    const examenesPromises = eeSnap.docs.map(async (asigDoc) => {
      const asignacion = { id: asigDoc.id, ...asigDoc.data() };
      const examenSnap = await getDoc(doc(db, 'examenes', asignacion.examen_id));
      const materiaSnap = await getDoc(doc(db, 'materias', asignacion.materia_id));
      return {
        ...asignacion,
        titulo: examenSnap.exists() ? examenSnap.data().titulo : 'Examen no encontrado',
        fecha_examen: examenSnap.exists() ? examenSnap.data().fecha_examen : '',
        duracion_minutos: examenSnap.exists() ? examenSnap.data().duracion_minutos : '',
        materiaNombre: materiaSnap.exists() ? materiaSnap.data().nombre : 'Materia no encontrada',
      };
    });
    return Promise.all(examenesPromises);
  }

  handleOpenModal = (task) => this.setState({ isModalOpen: true, selectedTask: task });
  handleCloseModal = () => this.setState({ isModalOpen: false, selectedTask: null, entregaMetodo: 'drive' });
  handleInputChange = (e) => this.setState({ [e.target.name]: e.target.value });

  handleEntregarTarea = async () => {
    const { selectedTask, entregaMetodo } = this.state;
    if (!selectedTask) return;
    this.setState({ isSubmitting: true });
    try {
      const tareaRef = doc(db, 'estudiante_tarea', selectedTask.id);
      await updateDoc(tareaRef, {
        estado: 'entregado',
        metodo_entrega: entregaMetodo,
        fecha_entrega_estudiante: serverTimestamp()
      });
      
      this.setState(prevState => {
        const nuevasTareasAgrupadas = { ...prevState.tareasAgrupadas };
        const materiaKey = selectedTask.materiaNombre;
        nuevasTareasAgrupadas[materiaKey] = nuevasTareasAgrupadas[materiaKey].map(t => 
            t.id === selectedTask.id ? { ...t, estado: 'entregado' } : t
        );
        return { tareasAgrupadas: nuevasTareasAgrupadas };
      });
      
      this.handleCloseModal();
    } catch (error) {
      console.error("Error al entregar la tarea:", error);
    } finally {
      this.setState({ isSubmitting: false });
    }
  }

  render() {
    const { loading, error, tareasAgrupadas, examenesPendientes, isModalOpen, selectedTask, entregaMetodo, isSubmitting } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Mis Exámenes y Tareas</h3>

            <div className="card shadow-sm mb-4">
              <div className="card-header"><FileSignature size={18} className="me-2" />Exámenes Programados</div>
              <div className="card-body">
                {loading ? <p className="text-muted">Buscando exámenes...</p> : 
                 examenesPendientes.length > 0 ? (
                  <ul className="list-group list-group-flush">
                    {examenesPendientes.map(examen => (
                      <li key={examen.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{examen.titulo}</strong>
                          <span className="d-block text-muted">{examen.materiaNombre}</span>
                        </div>
                        <div className='text-end'>
                          <span className="badge bg-danger">Fecha: {examen.fecha_examen}</span>
                          <small className="d-block text-muted mt-1">Duración: {examen.duracion_minutos} min.</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                 ) : (
                  <p className="text-muted text-center mb-0">No tienes exámenes programados.</p>
                 )
                }
              </div>
            </div>

            <div className="tareas-container">
              <h4 className="mb-3">Tareas Asignadas</h4>
              {loading && <p>Cargando tareas...</p>}
              {error && <p className="text-danger">{error}</p>}
              {!loading && Object.keys(tareasAgrupadas).length === 0 && (
                <div className="alert alert-info">¡Felicidades! No tienes tareas pendientes.</div>
              )}
              {!loading && Object.keys(tareasAgrupadas).length > 0 && (
                Object.entries(tareasAgrupadas).map(([materia, tareas]) => (
                  <div key={materia} className="materia-group mb-4">
                    <h5>{materia}</h5>
                    {/* === CÓDIGO RESTAURADO === */}
                    <div className="list-group">
                      {tareas.map(tarea => (
                        <div key={tarea.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{tarea.titulo}</strong>
                            <small className="d-block text-muted">Fecha Límite: {tarea.fecha_entrega_tarea}</small>
                          </div>
                          <div>
                            {tarea.estado === 'pendiente' ? (
                              <button className="btn btn-primary btn-sm" onClick={() => this.handleOpenModal(tarea)}>
                                Entregar Tarea
                              </button>
                            ) : (
                              <span className="badge bg-success">Entregado</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* === FIN DEL CÓDIGO RESTAURADO === */}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>

        <Modal
          show={isModalOpen}
          onHide={this.handleCloseModal}
          title={`Entregar Tarea: ${selectedTask?.titulo}`}
          footer={
            <>
              <Button variant="secondary" onClick={this.handleCloseModal}>Cancelar</Button>
              <Button 
                variant="primary" 
                onClick={this.handleEntregarTarea}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Confirmando...' : 'Confirmar Entrega'}
              </Button>
            </>
          }
        >
          {selectedTask && (
            <>
              <div className="mb-3">
                <p className="mb-1"><strong>Materia:</strong> {selectedTask.materiaNombre}</p>
                <p className="mb-0"><strong>Fecha Límite:</strong> {selectedTask.fecha_entrega_tarea}</p>
              </div>
              <div className="mb-3">
                <label htmlFor="entregaMetodo" className="form-label">Método de Entrega</label>
                <select 
                  className="form-select" 
                  id="entregaMetodo" 
                  name="entregaMetodo" 
                  value={entregaMetodo} 
                  onChange={this.handleInputChange}
                >
                  <option value="drive">Google Drive</option>
                  <option value="correo">Correo Electrónico</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="plataforma">Plataforma/Enlace</option>
                </select>
              </div>
              <p className="form-text">Asegúrate de haber enviado tu tarea al docente por el medio que selecciones.</p>
            </>
          )}
        </Modal>
      </div>
    );
  }
}

export default EstudianteTareas;
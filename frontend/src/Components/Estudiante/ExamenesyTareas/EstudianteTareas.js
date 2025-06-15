import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import SidebarMenu from '../../SidebarMenu';
import Modal from '../../Utils/Modal'; // Usamos nuestro nuevo Modal basado en Bootstrap
import { Button } from 'react-bootstrap'; // Importamos el botón de react-bootstrap
import { ClipboardList, FileWarning } from 'lucide-react';
import '../../../Styles/Estudiante/EstudianteTareas.css';

class EstudianteTareas extends Component {
  state = {
    // Datos
    tareasAgrupadas: {}, // Ej: { 'Cálculo I': [tarea1, tarea2], ... }
    // Estado de la UI
    loading: true,
    error: null,
    currentUser: null,
    // Estado del Modal
    isModalOpen: false,
    selectedTask: null,
    entregaMetodo: 'drive', // Valor por defecto
    isSubmitting: false,
  };

  authSubscription = null;

  componentDidMount() {
    const auth = getAuth();
    this.authSubscription = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setState({ currentUser: user });
        this.loadTareas(user.uid);
      } else {
        this.setState({ loading: false, error: 'Debe iniciar sesión.' });
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }

  loadTareas = async (estudianteId) => {
    this.setState({ loading: true, error: null });
    try {
      // 1. Obtener todas las asignaciones de tareas del estudiante
      const etQuery = query(collection(db, 'estudiante_tarea'), where('estudiante_id', '==', estudianteId));
      const etSnap = await getDocs(etQuery);

      // 2. "Enriquecer" cada asignación con los detalles de la tarea y la materia
      const tareasPromises = etSnap.docs.map(async (asigDoc) => {
        const asignacion = { id: asigDoc.id, ...asigDoc.data() };
        
        const tareaSnap = await getDoc(doc(db, 'tareas', asignacion.tarea_id));
        const materiaSnap = await getDoc(doc(db, 'materias', asignacion.materia_id));

        return {
          ...asignacion,
          titulo: tareaSnap.exists() ? tareaSnap.data().titulo : 'Tarea no encontrada',
          descripcion: tareaSnap.exists() ? tareaSnap.data().descripcion : '',
          fecha_entrega_tarea: tareaSnap.exists() ? tareaSnap.data().fecha_entrega : '',
          materiaNombre: materiaSnap.exists() ? materiaSnap.data().nombre : 'Materia no encontrada',
        };
      });

      const tareasCompletas = await Promise.all(tareasPromises);

      // 3. Agrupar las tareas por nombre de materia
      const tareasAgrupadas = tareasCompletas.reduce((acc, tarea) => {
        const materia = tarea.materiaNombre;
        if (!acc[materia]) {
          acc[materia] = [];
        }
        acc[materia].push(tarea);
        return acc;
      }, {});
      
      this.setState({ tareasAgrupadas, loading: false });
    } catch (error) {
      console.error("Error cargando tareas:", error);
      this.setState({ error: 'No se pudieron cargar las tareas.', loading: false });
    }
  }

  // --- Lógica del Modal y Entrega ---

  handleOpenModal = (task) => {
    this.setState({ isModalOpen: true, selectedTask: task });
  }

  handleCloseModal = () => {
    this.setState({ isModalOpen: false, selectedTask: null, entregaMetodo: 'drive' });
  }

  handleInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

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
      
      // Actualizar el estado local para reflejar el cambio en la UI sin recargar
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
      // Aquí podrías manejar un estado de error para el modal
    } finally {
      this.setState({ isSubmitting: false });
    }
  }

  render() {
    const { loading, error, tareasAgrupadas, isModalOpen, selectedTask, entregaMetodo, isSubmitting } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Mis Exámenes y Tareas</h3>

            {/* Sección Exámenes */}
            <div className="card shadow-sm mb-4">
              <div className="card-header"><FileWarning size={18} className="me-2" />Exámenes Programados</div>
              <div className="card-body text-center text-muted">
                <p className="mb-0">No hay exámenes disponibles en este momento.</p>
              </div>
            </div>

            {/* Sección Tareas */}
            <div className="tareas-container">
              <h4 className="mb-3">Tareas Asignadas</h4>
              {loading && <p>Cargando...</p>}
              {error && <p className="text-danger">{error}</p>}

              {!loading && Object.keys(tareasAgrupadas).length > 0 ? (
                Object.entries(tareasAgrupadas).map(([materia, tareas]) => (
                  <div key={materia} className="materia-group mb-4">
                    <h5>{materia}</h5>
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
                  </div>
                ))
              ) : (
                !loading && <div className="alert alert-info">¡Felicidades! No tienes tareas pendientes.</div>
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
              <Button variant="secondary" onClick={this.handleCloseModal}>
                Cancelar
              </Button>
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
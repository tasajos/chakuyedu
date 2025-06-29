import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'; 
import SidebarMenu from '../../SidebarMenu';
import { BookCheck, FileSignature } from 'lucide-react';
import '../../../Styles/Docente/SistemaAcademico.css';

class SistemaAcademico extends Component {
  state = {
    materiasAsignadas: [],
    estudiantesConActividades: [], 
    notasTareasOriginales: {},
    notasExamenesOriginales: {},
    activeTab: {}, // { estudianteId: 'tareas' o 'examenes' }
    selectedMateriaId: '',
    loadingMaterias: true,
    loadingDetalles: false,
    mensaje: '',
    error: '',
    currentUser: null,
    isSaving: false,
  };

  authSubscription = null;

  componentDidMount() {
    const auth = getAuth();
    this.authSubscription = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setState({ currentUser: user }, () => {
          this.initializeComponent(user.uid);
        });
      } else {
        this.setState({ loadingMaterias: false, error: 'Debe iniciar sesión.' });
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }
  
  initializeComponent = async (uid) => {
    await this.loadMisMaterias(uid);
    const { location } = this.props;
    const queryParams = new URLSearchParams(location.search);
    const materiaIdFromQuery = queryParams.get('materia');

    if (materiaIdFromQuery && this.state.materiasAsignadas.some(m => m.id === materiaIdFromQuery)) {
      this.setState({ selectedMateriaId: materiaIdFromQuery });
      this.handleMateriaChange(materiaIdFromQuery);
    }
  }

  loadMisMaterias = async (docenteId) => {
    this.setState({ loadingMaterias: true });
    try {
      const dmQuery = query(collection(db, 'docente_materia'), where('docente_id', '==', docenteId));
      const dmSnap = await getDocs(dmQuery);
      const materiasPromises = dmSnap.docs.map(dmDoc => getDoc(doc(db, 'materias', dmDoc.data().materia_id)));
      const materiasSnaps = await Promise.all(materiasPromises);
      const materiasList = materiasSnaps.map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null).filter(Boolean);
      this.setState({ materiasAsignadas: materiasList, loadingMaterias: false });
    } catch (error) {
      this.setState({ error: 'Error al cargar sus materias.', loadingMaterias: false });
    }
  }

  handleMateriaChange = async (e) => {
    const materiaId = typeof e === 'object' && e.target ? e.target.value : e;
    this.setState({ selectedMateriaId: materiaId, estudiantesConActividades: [], notasTareasOriginales: {}, notasExamenesOriginales: {}, mensaje: '', error: '', activeTab: {} });
    if (!materiaId) return;

    this.setState({ loadingDetalles: true });
    try {
      const emQuery = query(collection(db, 'estudiante_materia'), where('materia_id', '==', materiaId));
      const emSnap = await getDocs(emQuery);
      const estudiantesIds = emSnap.docs.map(doc => doc.data().estudiante_id);
      if (estudiantesIds.length === 0) {
        this.setState({ loadingDetalles: false, estudiantesConActividades: [] });
        return;
      }
      
      const [estudiantesSnaps, etSnap, eeSnap] = await Promise.all([
        Promise.all(estudiantesIds.map(id => getDoc(doc(db, 'usuarios', id)))),
        getDocs(query(collection(db, 'estudiante_tarea'), where('materia_id', '==', materiaId), where('estudiante_id', 'in', estudiantesIds))),
        getDocs(query(collection(db, 'estudiante_examen'), where('materia_id', '==', materiaId), where('estudiante_id', 'in', estudiantesIds)))
      ]);

      const estudiantesList = estudiantesSnaps.map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null).filter(Boolean);
      
      const tareasPorEstudiante = {};
      etSnap.docs.forEach(d => {
        if (!tareasPorEstudiante[d.data().estudiante_id]) tareasPorEstudiante[d.data().estudiante_id] = [];
        tareasPorEstudiante[d.data().estudiante_id].push({ asignacionId: d.id, ...d.data() });
      });

      const examenesPorEstudiante = {};
      eeSnap.docs.forEach(d => {
        if (!examenesPorEstudiante[d.data().estudiante_id]) examenesPorEstudiante[d.data().estudiante_id] = [];
        examenesPorEstudiante[d.data().estudiante_id].push({ asignacionId: d.id, ...d.data() });
      });

      const tareaIds = [...new Set(etSnap.docs.map(d => d.data().tarea_id))];
      const examenIds = [...new Set(eeSnap.docs.map(d => d.data().examen_id))];
      
      const [tareasDetailsSnaps, examenesDetailsSnaps] = await Promise.all([
          tareaIds.length ? Promise.all(tareaIds.map(id => getDoc(doc(db, 'tareas', id)))) : [],
          examenIds.length ? Promise.all(examenIds.map(id => getDoc(doc(db, 'examenes', id)))) : []
      ]);

      const tareasDetailsMap = {};
      tareasDetailsSnaps.forEach(snap => { if(snap.exists()) tareasDetailsMap[snap.id] = snap.data(); });
      const examenesDetailsMap = {};
      examenesDetailsSnaps.forEach(snap => { if(snap.exists()) examenesDetailsMap[snap.id] = snap.data(); });

      const initialGradesTareas = {};
      const initialGradesExamenes = {};
      const finalData = estudiantesList.map(estudiante => {
        const tareasAsignadas = (tareasPorEstudiante[estudiante.id] || []).map(asig => {
          const calificacionNum = asig.calificacion !== null ? Number(asig.calificacion) : '';
          if (calificacionNum !== '') initialGradesTareas[asig.asignacionId] = calificacionNum;
          return { ...asig, titulo: tareasDetailsMap[asig.tarea_id]?.titulo || 'Tarea eliminada', calificacion: calificacionNum };
        });
        const examenesAsignados = (examenesPorEstudiante[estudiante.id] || []).map(asig => {
          const calificacionNum = asig.calificacion_obtenida !== null ? Number(asig.calificacion_obtenida) : '';
          if (calificacionNum !== '') initialGradesExamenes[asig.asignacionId] = calificacionNum;
          return { ...asig, titulo: examenesDetailsMap[asig.examen_id]?.titulo || 'Examen eliminado', calificacion: calificacionNum };
        });
        return { ...estudiante, tareasAsignadas, examenesAsignados };
      });

      this.setState({ 
        estudiantesConActividades: finalData, 
        notasTareasOriginales: initialGradesTareas, 
        notasExamenesOriginales: initialGradesExamenes,
        loadingDetalles: false 
      });
    } catch (error) {
      console.error("Error al cargar datos académicos:", error);
      this.setState({ error: 'Error al cargar los datos de la materia.', loadingDetalles: false });
    }
  }

  handleTabChange = (estudianteId, tab) => {
    this.setState(prevState => ({
        activeTab: { ...prevState.activeTab, [estudianteId]: tab }
    }));
  }

  handleNotaChange = (estudianteId, tipoActividad, asignacionId, nota) => {
    const keyActividades = tipoActividad === 'tareas' ? 'tareasAsignadas' : 'examenesAsignados';
    this.setState(prevState => ({
      estudiantesConActividades: prevState.estudiantesConActividades.map(est => {
        if (est.id === estudianteId) {
          return {
            ...est,
            [keyActividades]: est[keyActividades].map(actividad => {
              if (actividad.asignacionId === asignacionId) {
                return { ...actividad, calificacion: nota === '' ? '' : Number(nota) };
              }
              return actividad;
            })
          };
        }
        return est;
      })
    }));
  }

  handleGuardarNotas = async (estudianteId, tipoActividad) => {
    const estudiante = this.state.estudiantesConActividades.find(e => e.id === estudianteId);
    if (!estudiante) return;

    this.setState({ isSaving: true, mensaje: `Guardando notas de ${tipoActividad}...`, error: '' });
    
    const keyActividades = tipoActividad === 'tareas' ? 'tareasAsignadas' : 'examenesAsignados';
    const collectionName = tipoActividad === 'tareas' ? 'estudiante_tarea' : 'estudiante_examen';
    const fieldName = tipoActividad === 'tareas' ? 'calificacion' : 'calificacion_obtenida';
    const notasOriginalesKey = tipoActividad === 'tareas' ? 'notasTareasOriginales' : 'notasExamenesOriginales';

    try {
      const batch = writeBatch(db);
      const notasRecienGuardadas = {};

      estudiante[keyActividades].forEach(actividad => {
        const notaFinal = actividad.calificacion === '' ? null : Number(actividad.calificacion);
        if (notaFinal !== null && !isNaN(notaFinal)) {
          const docRef = doc(db, collectionName, actividad.asignacionId);
          batch.update(docRef, { [fieldName]: notaFinal });
          notasRecienGuardadas[actividad.asignacionId] = notaFinal;
        }
      });
      await batch.commit();

      this.setState(prevState => ({
        mensaje: `¡Notas de ${tipoActividad} guardadas correctamente!`,
        error: '',
        isSaving: false,
        [notasOriginalesKey]: { ...prevState[notasOriginalesKey], ...notasRecienGuardadas }
      }));
    } catch (error) {
      this.setState({ error: `Error al guardar las notas de ${tipoActividad}.`, mensaje: '', isSaving: false });
    }
  }

  calcularPromedio = (tareas) => {
    const notasValidas = tareas.map(t => t.calificacion).filter(n => n !== '' && !isNaN(n));
    if (notasValidas.length === 0) return 'N/A';
    const sum = notasValidas.reduce((acc, nota) => acc + Number(nota), 0);
    return (sum / notasValidas.length).toFixed(2);
  }

  render() {
    const { materiasAsignadas, estudiantesConActividades, selectedMateriaId, loadingMaterias, loadingDetalles, mensaje, error, notasTareasOriginales, notasExamenesOriginales, activeTab, isSaving } = this.state;
    
    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0">Sistema de Calificaciones</h3>
              <Link to="/Docente/GestionAcademica/CalificacionFinal" className="btn btn-success">Ir a Calificaciones Finales</Link>
            </div>
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <label htmlFor="materia-select" className="form-label fw-bold">Seleccione una Materia</label>
                <select 
                  id="materia-select" 
                  className="form-select" 
                  value={selectedMateriaId} 
                  onChange={this.handleMateriaChange} 
                  disabled={loadingMaterias}
                >
                  <option value="">-- Mis Materias --</option>
                  {loadingMaterias ? (
                    <option disabled>Cargando materias...</option>
                  ) : (
                    materiasAsignadas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)
                  )}
                </select>
              </div>
            </div>

            {mensaje && <div className="alert alert-success mt-3">{mensaje}</div>}
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            
            {selectedMateriaId && (
              loadingDetalles ? <div className="text-center p-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div> :
              <div className="lista-calificaciones mt-4">
                {estudiantesConActividades.map(estudiante => {
                  const tabActual = activeTab[estudiante.id] || 'tareas';
                  return (
                  <div key={estudiante.id} className="card shadow-sm mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">{`${estudiante.nombre} ${estudiante.apellido_paterno}`}</h5>
                      <span className="fw-bold">Promedio Tareas: {this.calcularPromedio(estudiante.tareasAsignadas)}</span>
                    </div>
                    <div className="card-body">
                      <ul className="nav nav-tabs nav-fill mb-3">
                        <li className="nav-item">
                          <a className={`nav-link ${tabActual === 'tareas' ? 'active' : ''}`} href="#" onClick={(e) => {e.preventDefault(); this.handleTabChange(estudiante.id, 'tareas');}}>
                            Tareas ({estudiante.tareasAsignadas.length})
                          </a>
                        </li>
                        <li className="nav-item">
                          <a className={`nav-link ${tabActual === 'examenes' ? 'active' : ''}`} href="#" onClick={(e) => {e.preventDefault(); this.handleTabChange(estudiante.id, 'examenes');}}>
                            Exámenes ({estudiante.examenesAsignados.length})
                          </a>
                        </li>
                      </ul>

                      <div className="tab-content">
                        {tabActual === 'tareas' && (
                          estudiante.tareasAsignadas.length > 0 ? (
                            estudiante.tareasAsignadas.map(tarea => (
                              <div key={tarea.asignacionId} className="row g-3 align-items-center mb-2">
                                <div className="col-md-8"><label className="form-label-plaintext">{tarea.titulo}</label></div>
                                <div className="col-md-4"><input type="number" className="form-control" value={tarea.calificacion} onChange={(e) => this.handleNotaChange(estudiante.id, 'tareas', tarea.asignacionId, e.target.value)} disabled={notasTareasOriginales[tarea.asignacionId] !== undefined} /></div>
                              </div>
                            ))
                          ) : <p className="text-muted">No hay tareas para calificar.</p>
                        )}
                        {tabActual === 'examenes' && (
                           estudiante.examenesAsignados.length > 0 ? (
                            estudiante.examenesAsignados.map(examen => (
                              <div key={examen.asignacionId} className="row g-3 align-items-center mb-2">
                                <div className="col-md-8"><label className="form-label-plaintext">{examen.titulo}</label></div>
                                <div className="col-md-4"><input type="number" className="form-control" value={examen.calificacion} onChange={(e) => this.handleNotaChange(estudiante.id, 'examenes', examen.asignacionId, e.target.value)} disabled={notasExamenesOriginales[examen.asignacionId] !== undefined} /></div>
                              </div>
                            ))
                          ) : <p className="text-muted">No hay exámenes para calificar.</p>
                        )}
                      </div>
                    </div>
                    <div className="card-footer text-end">
                       <button className="btn btn-primary" onClick={() => this.handleGuardarNotas(estudiante.id, tabActual)} disabled={isSaving}>
                         {isSaving ? 'Guardando...' : `Guardar Notas de ${tabActual === 'tareas' ? 'Tareas' : 'Exámenes'}`}
                       </button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }
}

function SistemaAcademicoConRouter(props) {
    return (
      <SistemaAcademico
        {...props}
        params={useParams()}
        navigate={useNavigate()}
        location={useLocation()}
      />
    );
}

export default SistemaAcademicoConRouter;
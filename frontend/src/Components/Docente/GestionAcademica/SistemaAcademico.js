import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';

import SidebarMenu from '../../SidebarMenu';
import { BookCheck } from 'lucide-react';
import '../../../Styles/Docente/SistemaAcademico.css';

class SistemaAcademico extends Component {
  // === 1. SE AÑADE 'notasOriginales' AL ESTADO ===
  state = {
    materiasAsignadas: [],
    estudiantesConTareas: [], 
    notasOriginales: {}, // Guardará las notas tal como vienen de Firestore
    selectedMateriaId: '',
    loadingMaterias: true,
    loadingDetalles: false,
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
        this.loadMisMaterias(user.uid);
      } else {
        this.setState({ loadingMaterias: false, error: 'Debe iniciar sesión.' });
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }

  loadMisMaterias = async (docenteId) => {
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
    const materiaId = e.target.value;
    this.setState({ selectedMateriaId: materiaId, estudiantesConTareas: [], notasOriginales: {}, mensaje: '', error: '' });
    if (!materiaId) return;

    this.setState({ loadingDetalles: true });
    try {
      const emQuery = query(collection(db, 'estudiante_materia'), where('materia_id', '==', materiaId));
      const emSnap = await getDocs(emQuery);
      const estudiantesIds = emSnap.docs.map(doc => doc.data().estudiante_id);

      if (estudiantesIds.length === 0) {
        this.setState({ loadingDetalles: false });
        return;
      }

      const estudiantesPromises = estudiantesIds.map(id => getDoc(doc(db, 'usuarios', id)));
      const estudiantesSnaps = await Promise.all(estudiantesPromises);
      const estudiantesList = estudiantesSnaps.map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null).filter(Boolean);
      
      const etQuery = query(collection(db, 'estudiante_tarea'), where('estudiante_id', 'in', estudiantesIds), where('materia_id', '==', materiaId));
      const etSnap = await getDocs(etQuery);
      
      const tareasPorEstudiante = {};
      etSnap.docs.forEach(doc => {
          const data = doc.data();
          if (!tareasPorEstudiante[data.estudiante_id]) {
              tareasPorEstudiante[data.estudiante_id] = [];
          }
          tareasPorEstudiante[data.estudiante_id].push({ asignacionId: doc.id, ...data });
      });

      const tareaIds = [...new Set(etSnap.docs.map(doc => doc.data().tarea_id))];
      const tareasDetailsPromises = tareaIds.map(id => getDoc(doc(db, 'tareas', id)));
      const tareasDetailsSnaps = await Promise.all(tareasDetailsPromises);
      const tareasDetailsMap = {};
      tareasDetailsSnaps.forEach(snap => {
        if(snap.exists()) tareasDetailsMap[snap.id] = snap.data();
      });

      // === 2. SE LLENA EL ESTADO 'notasOriginales' AL CARGAR LOS DATOS ===
      const initialGrades = {};
      const finalData = estudiantesList.map(estudiante => {
        const asignaciones = tareasPorEstudiante[estudiante.id] || [];
        const tareasAsignadas = asignaciones.map(asig => {
          const calificacionNum = asig.calificacion !== null ? Number(asig.calificacion) : '';
          // Si la calificación existe, la guardamos en nuestro objeto de referencia
          if (calificacionNum !== '') {
            initialGrades[asig.asignacionId] = calificacionNum;
          }
          return {
            ...asig,
            titulo: tareasDetailsMap[asig.tarea_id]?.titulo || 'Tarea eliminada',
            calificacion: calificacionNum,
          };
        });
        return { ...estudiante, tareasAsignadas };
      });

      this.setState({ 
        estudiantesConTareas: finalData, 
        notasOriginales: initialGrades, 
        loadingDetalles: false 
      });

    } catch (error) {
      console.error("Error al cargar datos académicos:", error);
      this.setState({ error: 'Error al cargar los datos de la materia.', loadingDetalles: false });
    }
  }
  
  handleNotaChange = (estudianteId, asignacionId, nota) => {
    this.setState(prevState => ({
      estudiantesConTareas: prevState.estudiantesConTareas.map(est => {
        if (est.id === estudianteId) {
          return {
            ...est,
            tareasAsignadas: est.tareasAsignadas.map(tarea => {
              if (tarea.asignacionId === asignacionId) {
                return { ...tarea, calificacion: nota === '' ? '' : Number(nota) };
              }
              return tarea;
            })
          };
        }
        return est;
      })
    }));
  }

  // === 3. SE MODIFICA handleGuardarNotas PARA ACTUALIZAR EL ESTADO ORIGINAL ===
  handleGuardarNotas = async (estudianteId) => {
    const estudiante = this.state.estudiantesConTareas.find(e => e.id === estudianteId);
    if (!estudiante) return;
    
    this.setState({ mensaje: `Guardando notas para ${estudiante.nombre}...`, error: '' });

    try {
      const batch = writeBatch(db);
      const notasRecienGuardadas = {};

      estudiante.tareasAsignadas.forEach(tarea => {
        const notaFinal = tarea.calificacion === '' ? null : Number(tarea.calificacion);
        if (notaFinal !== null && !isNaN(notaFinal)) {
          const tareaRef = doc(db, 'estudiante_tarea', tarea.asignacionId);
          batch.update(tareaRef, { calificacion: notaFinal });
          // Registramos la nota que acabamos de guardar
          notasRecienGuardadas[tarea.asignacionId] = notaFinal;
        }
      });

      await batch.commit();

      // Actualizamos el estado de referencia para bloquear los campos recién guardados
      this.setState(prevState => ({
        mensaje: '¡Notas guardadas correctamente!',
        error: '',
        notasOriginales: { ...prevState.notasOriginales, ...notasRecienGuardadas }
      }));
    } catch (error) {
      this.setState({ error: 'Error al guardar las notas.', mensaje: '' });
    }
  }

  calcularPromedio = (tareas) => {
    const notasValidas = tareas.map(t => t.calificacion).filter(n => n !== '' && !isNaN(n));
    if (notasValidas.length === 0) return 'N/A';
    const sum = notasValidas.reduce((acc, nota) => acc + Number(nota), 0);
    return (sum / notasValidas.length).toFixed(2);
  }

  render() {
    const { materiasAsignadas, estudiantesConTareas, selectedMateriaId, loadingMaterias, loadingDetalles, mensaje, error, notasOriginales } = this.state;
    
    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Sistema de Calificaciones</h3>
            
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

            {selectedMateriaId && (
              loadingDetalles ? <p>Cargando datos académicos...</p> :
              <div className="lista-calificaciones mt-4">
                {estudiantesConTareas.map(estudiante => (
                  <div key={estudiante.id} className="card shadow-sm mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">{`${estudiante.nombre} ${estudiante.apellido_paterno}`}</h5>
                      <span className="fw-bold">Promedio: {this.calcularPromedio(estudiante.tareasAsignadas)}</span>
                    </div>
                    <div className="card-body">
                      {estudiante.tareasAsignadas.length > 0 ? (
                        estudiante.tareasAsignadas.map(tarea => (
                          <div key={tarea.asignacionId} className="row g-3 align-items-center mb-2">
                            <div className="col-md-8">
                              <label className="form-label-plaintext">{tarea.titulo}</label>
                            </div>
                            <div className="col-md-4">
                              <input
                                type="number"
                                className="form-control"
                                min="0"
                                max="100"
                                placeholder="Nota / 100"
                                value={tarea.calificacion}
                                onChange={(e) => this.handleNotaChange(estudiante.id, tarea.asignacionId, e.target.value)}
                                // === 4. LÓGICA DE 'disabled' CORREGIDA ===
                                disabled={notasOriginales[tarea.asignacionId] !== undefined}
                              />
                            </div>
                          </div>
                        ))
                      ) : <p className="text-muted">Este estudiante no tiene tareas asignadas.</p>}
                    </div>
                    <div className="card-footer text-end">
                       <button className="btn btn-primary" onClick={() => this.handleGuardarNotas(estudiante.id)}>
                         Guardar Notas de {estudiante.nombre}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {mensaje && <div className="alert alert-success mt-3">{mensaje}</div>}
            {error && <div className="alert alert-danger mt-3">{error}</div>}
          </div>
        </main>
      </div>
    );
  }
}

export default SistemaAcademico;
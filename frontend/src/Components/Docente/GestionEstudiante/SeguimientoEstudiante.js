import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Link } from 'react-router-dom';

import SidebarMenu from '../../SidebarMenu';
import Modal from '../../Utils/Modal';
import { Button } from 'react-bootstrap';
import { BookCopy, CheckSquare, Smile, FileSignature } from 'lucide-react';
import '../../../Styles/Docente/SeguimientoEstudiante.css';

class SeguimientoEstudiante extends Component {
  state = {
    // Datos cargados
    materiasAsignadas: [],
    tareasDisponibles: [],
    examenesDisponibles: [],
    estudiantes: [],
    // Estado de la UI
    selectedMateriaId: '',
    selectedTareaId: '',
    selectedExamenId: '',
    // Estados de carga y mensajes
    loadingMaterias: true,
    loadingDetalles: false,
    mensaje: '',
    error: '',
    currentUser: null,
    // Estado para el Modal
    isModalOpen: false,
    modalType: '',
    selectedStudent: null,
    observacion: '',
    comportamientoSeleccionado: '',
    isSavingRegistro: false,
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

  loadTareasPorMateria = async (materiaId) => {
    try {
      const q = query(collection(db, 'tareas'), where('materia_id', '==', materiaId));
      const tareasSnap = await getDocs(q);
      const tareasList = tareasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.setState({ tareasDisponibles: tareasList });
    } catch (error) {
      this.setState({ error: 'Error al cargar las tareas de esta materia.' });
    }
  }

  loadExamenesPorMateria = async (materiaId) => {
    try {
      const q = query(collection(db, 'examenes'), where('materia_id', '==', materiaId));
      const examenesSnap = await getDocs(q);
      const examenesList = examenesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.setState({ examenesDisponibles: examenesList });
    } catch (error) {
      this.setState({ error: 'Error al cargar los exámenes de esta materia.' });
    }
  }

  handleMateriaChange = async (e) => {
    const materiaId = e.target.value;
    this.setState({ 
      selectedMateriaId: materiaId, 
      estudiantes: [], 
      tareasDisponibles: [],
      examenesDisponibles: [],
      selectedTareaId: '',
      selectedExamenId: '',
      mensaje: '', 
      error: '' 
    });

    if (!materiaId) return;

    this.setState({ loadingDetalles: true });
    try {
      const emQuery = query(collection(db, 'estudiante_materia'), where('materia_id', '==', materiaId));
      const emSnap = await getDocs(emQuery);
      const estudiantesPromises = emSnap.docs.map(emDoc => getDoc(doc(db, 'usuarios', emDoc.data().estudiante_id)));
      
      await Promise.all([
        Promise.all(estudiantesPromises).then(snaps => {
          const estudiantesList = snaps.map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null).filter(Boolean);
          this.setState({ estudiantes: estudiantesList });
        }),
        this.loadTareasPorMateria(materiaId),
        this.loadExamenesPorMateria(materiaId)
      ]);

    } catch (error) {
      this.setState({ error: 'Error al cargar los detalles de la materia.' });
    } finally {
      this.setState({ loadingDetalles: false });
    }
  }

  handleTareaChange = (e) => this.setState({ selectedTareaId: e.target.value });
  handleExamenChange = (e) => this.setState({ selectedExamenId: e.target.value });

  handleAsignarTarea = async (estudianteId = null) => {
    const { selectedTareaId, selectedMateriaId, currentUser, estudiantes } = this.state;
    if (!selectedTareaId) {
      this.setState({ error: 'Por favor, seleccione una tarea para asignar.' });
      return;
    }
    const targets = estudianteId ? [estudiantes.find(e => e.id === estudianteId)] : estudiantes;
    if (!targets[0]) {
      this.setState({ error: 'Estudiante no encontrado.' });
      return;
    }
    this.setState({ mensaje: 'Verificando y asignando tarea(s)...', error: '' });
    try {
      const batch = writeBatch(db);
      const yaAsignados = [];
      const nuevosAsignados = [];
      for (const est of targets) {
        const q = query(collection(db, 'estudiante_tarea'), where('estudiante_id', '==', est.id), where('tarea_id', '==', selectedTareaId));
        const existingAssignmentSnap = await getDocs(q);
        if (existingAssignmentSnap.empty) {
          const newAsignacionRef = doc(collection(db, 'estudiante_tarea'));
          batch.set(newAsignacionRef, {
            estudiante_id: est.id,
            tarea_id: selectedTareaId,
            materia_id: selectedMateriaId,
            docente_id: currentUser.uid,
            estado: 'pendiente',
            fecha_asignacion: serverTimestamp(),
            calificacion: null,
            feedback_docente: ''
          });
          nuevosAsignados.push(`${est.nombre} ${est.apellido_paterno}`);
        } else {
          yaAsignados.push(`${est.nombre} ${est.apellido_paterno}`);
        }
      }
      if (nuevosAsignados.length > 0) {
        await batch.commit();
      }
      let successMsg = '';
      let errorMsg = '';
      if (nuevosAsignados.length > 0) {
        successMsg = `Tarea asignada correctamente a: ${nuevosAsignados.join(', ')}.`;
      }
      if (yaAsignados.length > 0) {
        errorMsg = `La tarea ya estaba asignada a: ${yaAsignados.join(', ')}.`;
      }
      this.setState({ mensaje: successMsg, error: errorMsg });
    } catch (error) {
      this.setState({ error: 'No se pudo completar la asignación.', mensaje: '' });
    }
  };

  handleAsignarExamen = async (estudianteId = null) => {
    const { selectedExamenId, selectedMateriaId, currentUser, estudiantes } = this.state;
    if (!selectedExamenId) {
      this.setState({ error: 'Por favor, seleccione un examen para asignar.' });
      return;
    }
    const targets = estudianteId ? [estudiantes.find(e => e.id === estudianteId)] : estudiantes;
    if (!targets[0]) {
      this.setState({ error: 'Estudiante no encontrado.' });
      return;
    }
    this.setState({ mensaje: 'Verificando y asignando examen(es)...', error: '' });
    try {
      const batch = writeBatch(db);
      const yaAsignados = [];
      const nuevosAsignados = [];
      for (const est of targets) {
        const q = query(collection(db, 'estudiante_examen'), where('estudiante_id', '==', est.id), where('examen_id', '==', selectedExamenId));
        const existingAssignmentSnap = await getDocs(q);
        if (existingAssignmentSnap.empty) {
          const newAsignacionRef = doc(collection(db, 'estudiante_examen'));
          batch.set(newAsignacionRef, {
            estudiante_id: est.id,
            examen_id: selectedExamenId,
            materia_id: selectedMateriaId,
            docente_id: currentUser.uid,
            estado: 'pendiente',
            fecha_asignacion: serverTimestamp(),
            calificacion_obtenida: null,
          });
          nuevosAsignados.push(`${est.nombre} ${est.apellido_paterno}`);
        } else {
          yaAsignados.push(`${est.nombre} ${est.apellido_paterno}`);
        }
      }
      if (nuevosAsignados.length > 0) {
        await batch.commit();
      }
      let successMsg = '';
      let errorMsg = '';
      if (nuevosAsignados.length > 0) {
        successMsg = `Examen asignado correctamente a: ${nuevosAsignados.join(', ')}.`;
      }
      if (yaAsignados.length > 0) {
        errorMsg = `El examen ya estaba asignado a: ${yaAsignados.join(', ')}.`;
      }
      this.setState({ mensaje: successMsg, error: errorMsg });
    } catch (error) {
      this.setState({ error: 'No se pudo completar la asignación del examen.', mensaje: '' });
    }
  }

  handleOpenModal = (student, type) => {
    this.setState({
      isModalOpen: true,
      modalType: type,
      selectedStudent: student,
      observacion: '',
      comportamientoSeleccionado: '',
      mensaje: '',
      error: '',
    });
  }

  handleCloseModal = () => {
    this.setState({
      isModalOpen: false,
      selectedStudent: null,
      modalType: '',
    });
  }

  handleModalInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleSaveRegistro = async () => {
    const { modalType, selectedStudent, observacion, comportamientoSeleccionado, currentUser, selectedMateriaId } = this.state;
    if (!selectedStudent) return;
    this.setState({ isSavingRegistro: true, error: '', mensaje: '' });
    try {
      let collectionName = '';
      let dataToSave = {
        estudiante_id: selectedStudent.id,
        estudiante_nombre: `${selectedStudent.nombre} ${selectedStudent.apellido_paterno}`,
        docente_id: currentUser.uid,
        materia_id: selectedMateriaId,
        observacion: observacion || '',
        createdAt: serverTimestamp(),
      };
      if (modalType === 'notas') {
        collectionName = 'registros_notas';
      } else if (modalType === 'comportamiento') {
        collectionName = 'registros_comportamiento';
        dataToSave.comportamiento = comportamientoSeleccionado || 'No especificado';
      } else {
        throw new Error("Tipo de registro no válido");
      }
      await addDoc(collection(db, collectionName), dataToSave);
      this.setState({
        mensaje: `Registro de ${modalType} guardado correctamente.`,
        isSavingRegistro: false,
      });
      this.handleCloseModal();
    } catch (e) {
      this.setState({
        error: `No se pudo guardar el registro.`,
        isSavingRegistro: false,
      });
    }
  }

  render() {
    const { 
        materiasAsignadas, tareasDisponibles, examenesDisponibles, estudiantes, 
        selectedMateriaId, selectedTareaId, selectedExamenId, 
        loadingMaterias, loadingDetalles, mensaje, error,
        isModalOpen, modalType, selectedStudent, observacion, comportamientoSeleccionado, isSavingRegistro 
    } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Seguimiento de Estudiantes</h3>
            
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <label htmlFor="materia-select" className="form-label fw-bold">Seleccione una Materia</label>
                <select id="materia-select" className="form-select" value={selectedMateriaId} onChange={this.handleMateriaChange} disabled={loadingMaterias}>
                  <option value="">-- Mis Materias --</option>
                  {materiasAsignadas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
            </div>

            {loadingDetalles && <div className="text-center p-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}

            {selectedMateriaId && !loadingDetalles && (
              <>
                <div className="card shadow-sm mb-4">
                  <div className="card-header"><FileSignature size={18} className="me-2" /> Asignar Examen a la Clase</div>
                  <div className="card-body">
                    <div className="row g-2 align-items-end">
                      <div className="col-md-9">
                        <label htmlFor="examen-select" className="form-label">Examen a Asignar</label>
                        <select id="examen-select" className="form-select" value={selectedExamenId} onChange={this.handleExamenChange}>
                          <option value="">-- Exámenes de esta Materia --</option>
                          {examenesDisponibles.map(ex => <option key={ex.id} value={ex.id}>{ex.titulo}</option>)}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <button className="btn btn-primary w-100" onClick={() => this.handleAsignarExamen()} disabled={!selectedExamenId || estudiantes.length === 0}>
                          Asignar Examen a Todos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card shadow-sm mb-4">
                  <div className="card-header"><BookCopy size={18} className="me-2" /> Asignar Tarea a la Clase</div>
                  <div className="card-body">
                    <div className="row g-2 align-items-end">
                      <div className="col-md-9">
                        <label htmlFor="tarea-select" className="form-label">Tarea a Asignar</label>
                        <select id="tarea-select" className="form-select" value={selectedTareaId} onChange={this.handleTareaChange}>
                          <option value="">-- Tareas de esta Materia --</option>
                          {tareasDisponibles.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <button className="btn btn-secondary w-100" onClick={() => this.handleAsignarTarea()} disabled={!selectedTareaId || estudiantes.length === 0}>
                          Asignar a Todos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {mensaje && <div className="alert alert-success">{mensaje}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="card shadow-sm">
                  <div className="card-header">Lista de Estudiantes ({estudiantes.length})</div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Nro</th>
                            <th>Nombre Completo</th>
                            <th>Email</th>
                            <th className="text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estudiantes.length > 0 ? estudiantes.map((est, i) => (
                            <tr key={est.id}>
                              <td>{i + 1}</td>
                              <td>{`${est.nombre} ${est.apellido_paterno}`}</td>
                              <td>{est.correo}</td>
                              <td className="text-center actions-cell">
                                <button className="btn btn-sm btn-outline-primary me-1" onClick={() => this.handleAsignarExamen(est.id)} disabled={!selectedExamenId}>Asignar Examen</button>
                                <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => this.handleAsignarTarea(est.id)} disabled={!selectedTareaId}>Asignar Tarea</button>
                                <button onClick={() => this.handleOpenModal(est, 'notas')} className="btn btn-sm btn-outline-success me-1"><CheckSquare size={16} /> Notas</button>
                                <button onClick={() => this.handleOpenModal(est, 'comportamiento')} className="btn btn-sm btn-outline-warning"><Smile size={16} /> Comportamiento</button>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="4" className="text-center text-muted p-4">No hay estudiantes en esta materia.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
        
        <Modal
          show={isModalOpen}
          onHide={this.handleCloseModal}
          title={`Registrar ${modalType === 'notas' ? 'Nota' : 'Comportamiento'} para ${selectedStudent?.nombre}`}
          footer={
            <>
              <Button variant="secondary" onClick={this.handleCloseModal}>Cancelar</Button>
              <Button
                variant="primary"
                onClick={this.handleSaveRegistro}
                disabled={isSavingRegistro}
              >
                {isSavingRegistro ? 'Guardando...' : 'Guardar Registro'}
              </Button>
            </>
          }
        >
          {modalType === 'comportamiento' && (
            <div className="mb-3">
              <label htmlFor="comportamientoSeleccionado" className="form-label">Nivel de Comportamiento</label>
              <select
                className="form-select"
                id="comportamientoSeleccionado"
                name="comportamientoSeleccionado"
                value={comportamientoSeleccionado}
                onChange={this.handleModalInputChange}
              >
                <option value="">-- Seleccionar nivel --</option>
                <option value="Comportamiento Malo">Comportamiento Malo</option>
                <option value="Muy Bueno">Muy Bueno</option>
                <option value="Excelente">Excelente</option>
              </select>
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="observacion" className="form-label">Observaciones (Opcional)</label>
            <textarea
              className="form-control"
              id="observacion"
              name="observacion"
              rows="4"
              value={observacion}
              onChange={this.handleModalInputChange}
              placeholder="Escriba aquí sus observaciones..."
            ></textarea>
          </div>
        </Modal>
      </div>
    );
  }
}

export default SeguimientoEstudiante;
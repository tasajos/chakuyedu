import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, writeBatch, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import SidebarMenu from '../../SidebarMenu';
import '../../../Styles/Docente/CalificacionFinal.css';

class CalificacionFinal extends Component {
  state = {
    materiasAsignadas: [],
    estudiantes: [],
    calificaciones: {},
    notasOriginales: {},
    selectedMateriaId: '',
    loadingMaterias: true,
    loadingDetalles: false,
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
    this.setState({ selectedMateriaId: materiaId, estudiantes: [], calificaciones: {}, notasOriginales: {}, mensaje: '', error: '' });
    if (!materiaId) return;

    this.setState({ loadingDetalles: true });
    try {
      const emQuery = query(collection(db, 'estudiante_materia'), where('materia_id', '==', materiaId));
      const emSnap = await getDocs(emQuery);
      const estudiantesList = await Promise.all(emSnap.docs.map(async (emDoc) => {
        const userSnap = await getDoc(doc(db, 'usuarios', emDoc.data().estudiante_id));
        return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
      }));
      const estudiantesFiltrados = estudiantesList.filter(Boolean);
      this.setState({ estudiantes: estudiantesFiltrados });

      const calificacionesPromises = estudiantesFiltrados.map(async (estudiante) => {
        const etQuery = query(collection(db, 'estudiante_tarea'), where('estudiante_id', '==', estudiante.id), where('materia_id', '==', materiaId));
        const etSnap = await getDocs(etQuery);
        const notasTareas = etSnap.docs.map(d => d.data().calificacion).filter(n => n !== null && !isNaN(n));
        const promedioTareas = notasTareas.length > 0 ? notasTareas.reduce((a, b) => a + b, 0) / notasTareas.length : 0;

        const califFinalRef = doc(db, 'calificaciones_finales', `${estudiante.id}_${materiaId}`);
        const califFinalSnap = await getDoc(califFinalRef);
        const datosGuardados = califFinalSnap.exists() ? califFinalSnap.data() : {};

        return {
          id: estudiante.id,
          promedioTareas: promedioTareas,
          notaTeoria: datosGuardados.nota_teoria ?? '',
          notaPractica: datosGuardados.nota_practica ?? '',
          notaAsistencia: datosGuardados.nota_asistencia ?? '',
          isSaved: califFinalSnap.exists()
        };
      });

      const calificacionesData = await Promise.all(calificacionesPromises);
      const calificacionesMap = {};
      const notasOriginalesMap = {};
      calificacionesData.forEach(data => {
        calificacionesMap[data.id] = data;
        if(data.isSaved) {
            notasOriginalesMap[data.id] = data;
        }
      });
      
      this.setState({ calificaciones: calificacionesMap, notasOriginales: notasOriginalesMap, loadingDetalles: false });

    } catch (error) {
      console.error("Error al cargar detalles académicos:", error);
      this.setState({ error: 'Error al cargar los datos.', loadingDetalles: false });
    }
  }

  handleNotaChange = (estudianteId, campo, valor) => {
    const numValor = valor === '' ? '' : Math.max(0, Math.min(100, Number(valor)));
    this.setState(prevState => ({
      calificaciones: {
        ...prevState.calificaciones,
        [estudianteId]: {
          ...prevState.calificaciones[estudianteId],
          [campo]: numValor,
        }
      }
    }));
  }
  
  calcularNotaFinal = (estudianteId) => {
    const notas = this.state.calificaciones[estudianteId];
    if (!notas) return 0;
    const pondTareas = (notas.promedioTareas || 0) * 0.05;
    const pondTeoria = (notas.notaTeoria || 0) * 0.40;
    const pondPractica = (notas.notaPractica || 0) * 0.50;
    const pondAsistencia = (notas.notaAsistencia || 0) * 0.05;
    const final = pondTareas + pondTeoria + pondPractica + pondAsistencia;
    return final.toFixed(2);
  }

  handleGuardarNotas = async () => {
    const { calificaciones, selectedMateriaId, currentUser } = this.state;
    this.setState({ isSaving: true, mensaje: '', error: '' });
    try {
        const batch = writeBatch(db);
        Object.keys(calificaciones).forEach(estudianteId => {
            const notas = calificaciones[estudianteId];
            const notaFinal = this.calcularNotaFinal(estudianteId);
            const docId = `${estudianteId}_${selectedMateriaId}`;
            const docRef = doc(db, 'calificaciones_finales', docId);
            
            batch.set(docRef, {
                estudiante_id: estudianteId,
                materia_id: selectedMateriaId,
                docente_id: currentUser.uid,
                promedio_tareas: notas.promedioTareas || 0,
                nota_teoria: notas.notaTeoria || 0,
                nota_practica: notas.notaPractica || 0,
                nota_asistencia: notas.notaAsistencia || 0,
                nota_final: Number(notaFinal),
                lastUpdated: serverTimestamp()
            });
        });
        await batch.commit();
        this.setState({ isSaving: false, mensaje: '¡Todas las notas fueron guardadas exitosamente!' });
        this.handleMateriaChange({ target: { value: selectedMateriaId } });
    } catch (error) {
        console.error("Error al guardar notas finales:", error);
        this.setState({ isSaving: false, error: 'Ocurrió un error al guardar las notas.' });
    }
  }

  render() {
    const { materiasAsignadas, estudiantes, calificaciones, selectedMateriaId, loadingMaterias, loadingDetalles, isSaving, mensaje, error } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Registro de Calificaciones Finales</h3>
            
            {/* === SECCIÓN CORREGIDA === */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <label htmlFor="materia-select-final" className="form-label fw-bold">Seleccione una Materia</label>
                <select 
                  id="materia-select-final" 
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
            {/* === FIN DE LA SECCIÓN CORREGIDA === */}

            {mensaje && <div className="alert alert-success">{mensaje}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {selectedMateriaId && (loadingDetalles ? <p>Cargando...</p> :
              <div className="card shadow-sm">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle mb-0">
                      <thead className="table-light text-center">
                        <tr>
                          <th>Estudiante</th>
                          <th>Tareas (5%)</th>
                          <th>Teoría (40%)</th>
                          <th>Práctica (50%)</th>
                          <th>Asistencia (5%)</th>
                          <th>Nota Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estudiantes.map(est => {
                          const notas = calificaciones[est.id] || {};
                          const notaFinal = this.calcularNotaFinal(est.id);
                          const isDisabled = this.state.notasOriginales[est.id]?.isSaved;
                          return (
                            <tr key={est.id}>
                              <td>{`${est.nombre} ${est.apellido_paterno}`}</td>
                              <td className="text-center">{(notas.promedioTareas * 0.05).toFixed(2)}</td>
                              <td><input type="number" className="form-control form-control-sm text-center" value={notas.notaTeoria} onChange={e => this.handleNotaChange(est.id, 'notaTeoria', e.target.value)} disabled={isDisabled}/></td>
                              <td><input type="number" className="form-control form-control-sm text-center" value={notas.notaPractica} onChange={e => this.handleNotaChange(est.id, 'notaPractica', e.target.value)} disabled={isDisabled}/></td>
                              <td><input type="number" className="form-control form-control-sm text-center" value={notas.notaAsistencia} onChange={e => this.handleNotaChange(est.id, 'notaAsistencia', e.target.value)} disabled={isDisabled}/></td>
                              <td className="text-center fw-bold">{notaFinal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-footer text-end">
                  <button className="btn btn-primary" onClick={this.handleGuardarNotas} disabled={isSaving || estudiantes.length === 0}>
                    {isSaving ? 'Guardando...' : 'Guardar Todas las Notas'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }
}

export default CalificacionFinal;
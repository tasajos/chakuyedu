import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useParams } from 'react-router-dom';
import SidebarMenu from '../../SidebarMenu';
import { BookOpen, User, ClipboardCheck, Smile, CheckSquare, Star } from 'lucide-react';
import '../../../Styles/Estudiante/EstudianteMateriaDetalle.css';

class EstudianteMateriaDetalle extends Component {
  state = {
    materia: null,
    docente: null,
    tareasCalificadas: [],
    calificacionFinal: null,
    asistencias: [],
    registrosNotas: [],
    registrosComportamiento: [],
    activeTab: 'tareas',
    loading: true,
    error: null,
    currentUser: null,
  };

  authSubscription = null;

  componentDidMount() {
    const auth = getAuth();
    this.authSubscription = onAuthStateChanged(auth, (user) => {
      if (user) {
        const { materiaId } = this.props.params;
        this.setState({ currentUser: user });
        if (materiaId) this.loadAllData(materiaId, user.uid);
      } else {
        this.setState({ loading: false, error: 'Debe iniciar sesión.' });
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }

  loadAllData = async (materiaId, estudianteId) => {
    this.setState({ loading: true, error: null });
    try {
      const [materiaSnap, docenteData, tareasSnap, califFinalSnap, asistenciasSnap, notasSnap, comportamientoSnap] = await Promise.all([
        getDoc(doc(db, 'materias', materiaId)),
        this.getDocenteDeMateria(materiaId),
        getDocs(query(collection(db, 'estudiante_tarea'), where('estudiante_id', '==', estudianteId), where('materia_id', '==', materiaId))),
        getDoc(doc(db, 'calificaciones_finales', `${estudianteId}_${materiaId}`)),
        getDocs(query(collection(db, 'asistencias'), where('estudiante_id', '==', estudianteId), where('materia_id', '==', materiaId))),
        getDocs(query(collection(db, 'registros_notas'), where('estudiante_id', '==', estudianteId), where('materia_id', '==', materiaId))),
        getDocs(query(collection(db, 'registros_comportamiento'), where('estudiante_id', '==', estudianteId), where('materia_id', '==', materiaId))),
      ]);

      const tareasCalificadas = await this.getTareasDetails(tareasSnap.docs);

      this.setState({
        materia: materiaSnap.exists() ? materiaSnap.data() : null,
        docente: docenteData,
        tareasCalificadas,
        calificacionFinal: califFinalSnap.exists() ? califFinalSnap.data() : null,
        asistencias: asistenciasSnap.docs.map(d => d.data()),
        registrosNotas: notasSnap.docs.map(d => d.data()),
        registrosComportamiento: comportamientoSnap.docs.map(d => d.data()),
        loading: false,
      });
    } catch (error) {
      console.error("Error cargando datos:", error);
      this.setState({ error: 'No se pudo cargar la información.', loading: false });
    }
  }

  getDocenteDeMateria = async (materiaId) => {
    const dmQuery = query(collection(db, 'docente_materia'), where('materia_id', '==', materiaId));
    const dmSnap = await getDocs(dmQuery);
    if (dmSnap.empty) return null;
    const docenteId = dmSnap.docs[0].data().docente_id;
    const docenteSnap = await getDoc(doc(db, 'usuarios', docenteId));
    return docenteSnap.exists() ? docenteSnap.data() : null;
  }
  
  getTareasDetails = async (asignacionesDocs) => {
    const tareasPromises = asignacionesDocs.map(async (asigDoc) => {
        const asigData = asigDoc.data();
        const tareaSnap = await getDoc(doc(db, 'tareas', asigData.tarea_id));
        return tareaSnap.exists() ? { ...asigData, ...tareaSnap.data() } : null;
    });
    return (await Promise.all(tareasPromises)).filter(Boolean);
  }

  handleTabChange = (tab) => this.setState({ activeTab: tab });

  // === MÉTODO RENDER CORREGIDO Y UNIFICADO ===
  render() {
    const { loading, error, materia, docente, activeTab, tareasCalificadas, calificacionFinal, asistencias, registrosNotas, registrosComportamiento } = this.state;

    const renderContent = () => {
        switch(activeTab) {
          case 'tareas':
            if (tareasCalificadas.length === 0) return <p>No tienes tareas asignadas en esta materia.</p>;
            return <table className="table table-striped"><thead><tr><th>Tarea</th><th>Fecha de Entrega</th><th>Nota</th></tr></thead><tbody>{tareasCalificadas.map((t,i) => <tr key={i}><td>{t.titulo}</td><td>{t.fecha_entrega}</td><td>{t.calificacion ?? 'Pendiente'}</td></tr>)}</tbody></table>;
          case 'final':
            return calificacionFinal ? <ul className="list-group">
                <li className="list-group-item d-flex justify-content-between"><span>Ponderado Tareas (5%)</span><strong>{(calificacionFinal.promedio_tareas * 0.05).toFixed(2)}</strong></li>
                <li className="list-group-item d-flex justify-content-between"><span>Nota Teoría (40%)</span><strong>{calificacionFinal.nota_teoria}</strong></li>
                <li className="list-group-item d-flex justify-content-between"><span>Nota Práctica (50%)</span><strong>{calificacionFinal.nota_practica}</strong></li>
                <li className="list-group-item d-flex justify-content-between"><span>Nota Asistencia (5%)</span><strong>{calificacionFinal.nota_asistencia}</strong></li>
                <li className="list-group-item d-flex justify-content-between active"><span>NOTA FINAL</span><strong style={{fontSize: '1.2rem'}}>{calificacionFinal.nota_final}</strong></li>
            </ul> : <div className="alert alert-info">Tu calificación final aún no ha sido publicada.</div>;
          case 'asistencia':
            if (asistencias.length === 0) return <p>No hay registros de asistencia.</p>;
            return <table className="table table-sm"><tbody>{asistencias.map((a,i) => <tr key={i} className={`asistencia-${a.estado}`}><td>{a.fecha}</td><td>{a.estado.charAt(0).toUpperCase() + a.estado.slice(1)}</td></tr>)}</tbody></table>;
          case 'registros':
            return <>
                <h5><CheckSquare size={18}/> Registros de Notas</h5>
                {registrosNotas.length > 0 ? registrosNotas.map((n,i) => <p key={`n-${i}`} className="registro-item"><strong>{new Date(n.createdAt.seconds*1000).toLocaleDateString()}:</strong> {n.observacion}</p>) : <p>No hay notas cualitativas.</p>}
                <hr/>
                <h5><Smile size={18}/> Registros de Comportamiento</h5>
                {registrosComportamiento.length > 0 ? registrosComportamiento.map((c,i) => <p key={`c-${i}`} className="registro-item"><strong>{new Date(c.createdAt.seconds*1000).toLocaleDateString()}:</strong> {c.comportamiento} - {c.observacion}</p>) : <p>No hay registros de comportamiento.</p>}
            </>;
          default: return null;
        }
    }

    if (loading) return <div className="dashboard-layout"><SidebarMenu /><main className="main-content p-4"><p>Cargando detalles...</p></main></div>;
    if (error) return <div className="dashboard-layout"><SidebarMenu /><main className="main-content p-4"><p className="text-danger">{error}</p></main></div>;
    if (!materia) return <div className="dashboard-layout"><SidebarMenu /><main className="main-content p-4"><p>Materia no encontrada.</p></main></div>;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <div className="materia-detalle-header mb-4">
              <div>
                <h3 className="mb-0">{materia.nombre}</h3>
                {docente && <p className="text-muted mb-0">Docente: {docente.nombre} {docente.apellido_paterno}</p>}
              </div>
            </div>
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item"><a className={`nav-link ${activeTab === 'tareas' ? 'active' : ''}`} href="#" onClick={(e) => {e.preventDefault(); this.handleTabChange('tareas');}}>Tareas</a></li>
              <li className="nav-item"><a className={`nav-link ${activeTab === 'final' ? 'active' : ''}`} href="#" onClick={(e) => {e.preventDefault(); this.handleTabChange('final');}}>Calificación Final</a></li>
              <li className="nav-item"><a className={`nav-link ${activeTab === 'asistencia' ? 'active' : ''}`} href="#" onClick={(e) => {e.preventDefault(); this.handleTabChange('asistencia');}}>Asistencia</a></li>
              <li className="nav-item"><a className={`nav-link ${activeTab === 'registros' ? 'active' : ''}`} href="#" onClick={(e) => {e.preventDefault(); this.handleTabChange('registros');}}>Registros</a></li>
            </ul>
            <div className="tab-content card card-body">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    );
  }
}

function EstudianteMateriaDetalleConRouter(props) {
  return <EstudianteMateriaDetalle {...props} params={useParams()} />;
}

export default EstudianteMateriaDetalleConRouter;
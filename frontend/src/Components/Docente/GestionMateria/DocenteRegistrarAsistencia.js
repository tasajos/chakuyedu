import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

import SidebarMenu from '../../SidebarMenu';
import '../../../Styles/Docente/DocenteRegistrarAsistencia.css';

const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

class DocenteRegistrarAsistencia extends Component {
    state = {
        materiasAsignadas: [],
        estudiantes: [],
        selectedMateriaId: '',
        selectedDate: getTodayDateString(),
        asistencias: {},
        isAsistenciaRegistrada: false,
        loadingMaterias: true,
        loadingDetalles: false,
        saving: false,
        mensaje: '',
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
        if (this.authSubscription) {
            this.authSubscription();
        }
    }
    
    loadMisMaterias = async (docenteId) => {
        try {
            const dmQuery = query(collection(db, 'docente_materia'), where('docente_id', '==', docenteId));
            const dmSnap = await getDocs(dmQuery);
            const materiasPromises = dmSnap.docs.map(dmDoc => getDoc(doc(db, 'materias', dmDoc.data().materia_id)));
            const materiasSnaps = await Promise.all(materiasPromises);
            const materiasList = materiasSnaps.map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null).filter(Boolean);
            
            this.setState({ materiasAsignadas: materiasList, loadingMaterias: false }, () => {
                const preSelectedId = this.props.location.state?.selectedMateriaId;
                if (preSelectedId && materiasList.some(m => m.id === preSelectedId)) {
                    // Pre-selecciona la materia en el dropdown y carga sus detalles
                    this.setState({ selectedMateriaId: preSelectedId }, () => {
                        this.handleMateriaChange({ target: { value: preSelectedId } });
                    });
                }
            });
        } catch (error) {
            console.error("Error al cargar materias del docente:", error);
            this.setState({ mensaje: 'Error al cargar sus materias.', loadingMaterias: false });
        }
    }

    handleMateriaChange = async (e) => {
        const materiaId = e.target.value;
        this.setState({
            selectedMateriaId: materiaId,
            estudiantes: [],
            asistencias: {},
            isAsistenciaRegistrada: false,
            mensaje: '',
        });

        if (!materiaId) return;
        
        this.setState({ loadingDetalles: true });
        try {
            const emQuery = query(collection(db, 'estudiante_materia'), where('materia_id', '==', materiaId));
            const emSnap = await getDocs(emQuery);
            const estudiantesPromises = emSnap.docs.map(emDoc => getDoc(doc(db, 'usuarios', emDoc.data().estudiante_id)));
            const estudiantesSnaps = await Promise.all(estudiantesPromises);
            const estudiantesList = estudiantesSnaps.map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null).filter(Boolean);

            this.setState({ estudiantes: estudiantesList }, () => {
                // Ahora que los estudiantes están cargados, verificamos la asistencia
                this.checkAndLoadAsistencia(materiaId, this.state.selectedDate);
            });

        } catch (error) {
            console.error("Error al cargar detalles:", error);
            this.setState({ mensaje: 'Error al cargar los detalles.', loadingDetalles: false });
        }
    }

    // === INICIO DE LOS MÉTODOS FALTANTES ===
    
    checkAndLoadAsistencia = async (materiaId, fecha) => {
        if (!materiaId || !fecha) return;

        this.setState({ loadingDetalles: true });
        const q = query(collection(db, 'asistencias'), where('materia_id', '==', materiaId), where('fecha', '==', fecha));
        const asistenciaSnap = await getDocs(q);

        if (!asistenciaSnap.empty) {
            const loadedAsistencias = {};
            asistenciaSnap.docs.forEach(doc => {
                const data = doc.data();
                loadedAsistencias[data.estudiante_id] = data.estado;
            });
            this.setState({
                asistencias: loadedAsistencias,
                isAsistenciaRegistrada: true,
                mensaje: 'Asistencia para esta fecha ya fue registrada (modo solo lectura).',
                loadingDetalles: false,
            });
        } else {
            const initialAsistencias = {};
            this.state.estudiantes.forEach(est => {
                initialAsistencias[est.id] = 'presente';
            });
            this.setState({
                asistencias: initialAsistencias,
                isAsistenciaRegistrada: false,
                mensaje: '',
                loadingDetalles: false,
            });
        }
    }

    handleDateChange = async (e) => {
        const newDate = e.target.value;
        this.setState({ selectedDate: newDate, mensaje: '' });
        await this.checkAndLoadAsistencia(this.state.selectedMateriaId, newDate);
    }

    handleAsistenciaChange = (estudianteId, estado) => {
        if (this.state.isAsistenciaRegistrada) return;
        this.setState(prevState => ({
            asistencias: {
                ...prevState.asistencias,
                [estudianteId]: estado
            }
        }));
    }

    handleGuardarAsistencia = async () => {
        const { selectedDate, selectedMateriaId, asistencias, isAsistenciaRegistrada, estudiantes } = this.state;
        if (isAsistenciaRegistrada || !selectedMateriaId || estudiantes.length === 0) return;

        this.setState({ saving: true, mensaje: '' });
        try {
            const savePromises = Object.keys(asistencias).map(estudianteId => {
                const docId = `${selectedDate}_${selectedMateriaId}_${estudianteId}`;
                const asistenciaRef = doc(db, 'asistencias', docId);
                return setDoc(asistenciaRef, {
                    fecha: selectedDate,
                    materia_id: selectedMateriaId,
                    estudiante_id: estudianteId,
                    estado: asistencias[estudianteId]
                });
            });
            await Promise.all(savePromises);
            this.setState({ mensaje: 'Asistencia guardada correctamente.', isAsistenciaRegistrada: true, saving: false });
        } catch (error) {
            console.error("Error al guardar:", error);
            this.setState({ mensaje: 'Error al guardar la asistencia.', saving: false });
        }
    }

    // === FIN DE LOS MÉTODOS FALTANTES ===
    
    render() {
        const { materiasAsignadas, estudiantes, selectedMateriaId, selectedDate, asistencias, isAsistenciaRegistrada, loadingMaterias, loadingDetalles, mensaje, saving } = this.state;

        return (
            <div className="dashboard-layout">
                <SidebarMenu />
                <main className="main-content">
                    <div className="container-fluid p-4">
                        <h3 className="mb-4">Registrar Asistencia</h3>
                        <div className="card shadow-sm mb-4">
                            <div className="card-body">
                                <div className="row g-3 align-items-end">
                                    <div className="col-md-5">
                                        <label htmlFor="materia-select" className="form-label">Mis Materias</label>
                                        <select id="materia-select" className="form-select" value={selectedMateriaId} onChange={this.handleMateriaChange} disabled={loadingMaterias}>
                                            <option value="">-- Seleccione una materia --</option>
                                            {materiasAsignadas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-5">
                                        <label htmlFor="fecha-select" className="form-label">Fecha</label>
                                        <input type="date" id="fecha-select" className="form-control" value={selectedDate} onChange={this.handleDateChange} />
                                    </div>
                                    <div className="col-md-2">
                                        <button className="btn btn-primary w-100" onClick={this.handleGuardarAsistencia} disabled={saving || estudiantes.length === 0 || isAsistenciaRegistrada}>
                                            {saving ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {mensaje && <div className={`alert ${mensaje.includes('Error') || mensaje.includes('lectura') ? 'alert-warning' : 'alert-success'} mt-3`}>{mensaje}</div>}
                        
                        <div className={`card shadow-sm ${isAsistenciaRegistrada ? 'readonly-mode' : ''}`}>
                            <div className="card-header">Lista de Estudiantes ({estudiantes.length})</div>
                            <div className="card-body p-0">
                                {loadingDetalles ? <p className="p-3">Cargando estudiantes...</p> : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '5%' }}>Nro</th>
                                                    <th>Nombre del Estudiante</th>
                                                    <th className="text-center" style={{ width: '25%' }}>Asistencia</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {estudiantes.length > 0 ? estudiantes.map((est, i) => (
                                                    <tr key={est.id}>
                                                        <td>{i + 1}</td>
                                                        <td>{`${est.nombre} ${est.apellido_paterno} ${est.apellido_materno}`}</td>
                                                        <td className="text-center">
                                                            <CheckCircle 
                                                                className={`asistencia-icon presente ${asistencias[est.id] === 'presente' ? 'active' : ''}`}
                                                                onClick={() => this.handleAsistenciaChange(est.id, 'presente')}
                                                            />
                                                            <XCircle 
                                                                className={`asistencia-icon ausente ${asistencias[est.id] === 'ausente' ? 'active' : ''}`}
                                                                onClick={() => this.handleAsistenciaChange(est.id, 'ausente')}
                                                            />
                                                            <Clock 
                                                                className={`asistencia-icon permiso ${asistencias[est.id] === 'permiso' ? 'active' : ''}`}
                                                                onClick={() => this.handleAsistenciaChange(est.id, 'permiso')}
                                                            />
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="3" className="text-center text-muted p-4">
                                                            {selectedMateriaId ? 'No hay estudiantes inscritos en esta materia.' : 'Seleccione una materia para ver los estudiantes.'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }
}

// HOC para inyectar los hooks de react-router en el componente de clase (SINTAXIS CORREGIDA)
function DocenteRegistrarAsistenciaConRouter(props) {
  return (
    <DocenteRegistrarAsistencia
        {...props}
        params={useParams()}
        location={useLocation()}
        navigate={useNavigate()}
    />
  );
}

export default DocenteRegistrarAsistenciaConRouter;
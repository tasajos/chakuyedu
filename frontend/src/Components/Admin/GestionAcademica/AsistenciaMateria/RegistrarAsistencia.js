// frontend/src/Components/Admin/RegistrarAsistencia.js
import React, { Component } from 'react';
import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import '../../../../Styles/Admin/RegistrarAsistencia.css';

const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

class RegistrarAsistencia extends Component {
    state = {
        materias: [],
        estudiantes: [],
        docente: null,
        selectedMateriaId: '',
        selectedDate: getTodayDateString(),
        asistencias: {},
        isAsistenciaRegistrada: false,
        loadingMaterias: true,
        loadingDetalles: false,
        saving: false,
        mensaje: '',
    };

    async componentDidMount() {
        this.loadMaterias();
    }

    loadMaterias = async () => {
        try {
            const materiasSnap = await getDocs(collection(db, 'materias'));
            const materiasList = materiasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.setState({ materias: materiasList, loadingMaterias: false });
        } catch (error) {
            console.error("Error al cargar materias:", error);
            this.setState({ mensaje: 'Error al cargar materias.', loadingMaterias: false });
        }
    }
    
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
            });
        }
        this.setState({ loadingDetalles: false });
    }

    handleMateriaChange = async (e) => {
        const materiaId = e.target.value;
        this.setState({
            selectedMateriaId: materiaId,
            docente: null,
            estudiantes: [],
            asistencias: {},
            isAsistenciaRegistrada: false,
            mensaje: '',
        });

        if (!materiaId) return;
        
        this.setState({ loadingDetalles: true });
        try {
            const dmQuery = query(collection(db, 'docente_materia'), where('materia_id', '==', materiaId));
            const dmSnap = await getDocs(dmQuery);
            if (!dmSnap.empty) {
                const docenteId = dmSnap.docs[0].data().docente_id;
                const docenteSnap = await getDoc(doc(db, 'usuarios', docenteId));
                if (docenteSnap.exists()) {
                    const d = docenteSnap.data();
                    this.setState({ docente: `${d.nombre} ${d.apellido_paterno}` });
                }
            }

            const emQuery = query(collection(db, 'estudiante_materia'), where('materia_id', '==', materiaId));
            const emSnap = await getDocs(emQuery);
            const estudiantesPromises = emSnap.docs.map(emDoc => getDoc(doc(db, 'usuarios', emDoc.data().estudiante_id)));
            const estudiantesSnaps = await Promise.all(estudiantesPromises);
            const estudiantesList = estudiantesSnaps.map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null).filter(Boolean);

            this.setState({ estudiantes: estudiantesList }, () => {
                this.checkAndLoadAsistencia(materiaId, this.state.selectedDate);
            });

        } catch (error) {
            console.error("Error al cargar detalles:", error);
            this.setState({ mensaje: 'Error al cargar los detalles.', loadingDetalles: false });
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
        const { selectedDate, selectedMateriaId, asistencias, isAsistenciaRegistrada } = this.state;
        if (isAsistenciaRegistrada) {
            this.setState({ mensaje: 'No se puede guardar, la asistencia ya está registrada.' });
            return;
        }
        if (!selectedMateriaId) {
            this.setState({ mensaje: 'Por favor, seleccione una materia.' });
            return;
        }

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

    render() {
        const { materias, docente, estudiantes, selectedMateriaId, selectedDate, asistencias, isAsistenciaRegistrada, loadingDetalles, mensaje, saving } = this.state;

        return (
            <div className="registrar-asistencia-container">
                <div className="container-fluid p-4">
                    <h3 className="mb-4">Registrar Asistencia</h3>
                    <div className="card shadow-sm mb-4 controles-card">
                        <div className="card-body">
                            <div className="row g-3 align-items-end">
                                <div className="col-md-5">
                                    <label htmlFor="materia-select" className="form-label">Materia</label>
                                    <select id="materia-select" className="form-select" value={selectedMateriaId} onChange={this.handleMateriaChange}>
                                        <option value="">-- Seleccione una materia --</option>
                                        {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
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
                            {docente && <p className="mt-3 mb-0"><strong>Docente:</strong> {docente}</p>}
                        </div>
                    </div>

                    {mensaje && <div className={`alert ${mensaje.includes('Error') || mensaje.includes('lectura') ? 'alert-warning' : 'alert-success'} mt-3`}>{mensaje}</div>}
                    
                    <div className={`card shadow-sm ${isAsistenciaRegistrada ? 'readonly-mode' : ''}`}>
                        <div className="card-header">Lista de Estudiantes ({estudiantes.length})</div>
                        <div className="card-body">
                            {loadingDetalles ? <p>Cargando...</p> : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        {/* --- CÓDIGO RESTAURADO --- */}
                                        <thead className="table-light">
                                            <tr>
                                                <th>Nro</th>
                                                <th>Nombre del Estudiante</th>
                                                <th className="text-center">Asistencia</th>
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
                                                    <td colSpan="3" className="text-center text-muted">Seleccione una materia para ver los estudiantes.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                         {/* --- FIN DEL CÓDIGO RESTAURADO --- */}
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default RegistrarAsistencia;
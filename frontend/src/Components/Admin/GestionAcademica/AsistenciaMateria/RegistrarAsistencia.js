// frontend/src/Components/Admin/RegistrarAsistencia.js
import React, { Component } from 'react';
import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import '../../../../Styles/Admin/RegistrarAsistencia.css';

// Función para obtener la fecha de hoy en formato YYYY-MM-DD
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
        asistencias: {}, // { estudianteId: 'presente' | 'ausente' | 'permiso' }
        loadingMaterias: true,
        loadingDetalles: false,
        saving: false,
        mensaje: '',
    };

    async componentDidMount() {
        this.loadMaterias();
    }

    // Carga todas las materias para el selector
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

    // Se activa al seleccionar una materia del dropdown
    handleMateriaChange = async (e) => {
        const materiaId = e.target.value;
        this.setState({ 
            selectedMateriaId: materiaId, 
            loadingDetalles: true, 
            docente: null, 
            estudiantes: [], 
            asistencias: {},
            mensaje: '' 
        });

        if (!materiaId) {
            this.setState({ loadingDetalles: false });
            return;
        }

        try {
            // Cargar docente
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

            // Cargar estudiantes
            const emQuery = query(collection(db, 'estudiante_materia'), where('materia_id', '==', materiaId));
            const emSnap = await getDocs(emQuery);
            
            const estudiantesPromises = emSnap.docs.map(async (emDoc) => {
                const estudianteId = emDoc.data().estudiante_id;
                const estSnap = await getDoc(doc(db, 'usuarios', estudianteId));
                if (estSnap.exists()) {
                    return { id: estSnap.id, ...estSnap.data() };
                }
                return null;
            });

            const estudiantesList = (await Promise.all(estudiantesPromises)).filter(Boolean);
            
            // Inicializar estado de asistencia para cada estudiante
            const initialAsistencias = {};
            estudiantesList.forEach(est => {
                initialAsistencias[est.id] = 'presente'; // Por defecto, todos presentes
            });

            this.setState({ estudiantes: estudiantesList, asistencias: initialAsistencias });

        } catch (error) {
            console.error("Error al cargar detalles de la materia:", error);
            this.setState({ mensaje: 'Error al cargar los detalles.' });
        } finally {
            this.setState({ loadingDetalles: false });
        }
    }
    
    // Cambia el estado de asistencia de un estudiante
    handleAsistenciaChange = (estudianteId, estado) => {
        this.setState(prevState => ({
            asistencias: {
                ...prevState.asistencias,
                [estudianteId]: estado
            }
        }));
    }

    // Guarda los datos en Firestore
    handleGuardarAsistencia = async () => {
        const { selectedDate, selectedMateriaId, asistencias } = this.state;
        if (!selectedMateriaId) {
            this.setState({ mensaje: 'Por favor, seleccione una materia.' });
            return;
        }
        
        this.setState({ saving: true, mensaje: '' });

        try {
            const savePromises = Object.keys(asistencias).map(estudianteId => {
                const estado = asistencias[estudianteId];
                // Usamos un ID de documento predecible para evitar duplicados
                const docId = `${selectedDate}_${selectedMateriaId}_${estudianteId}`;
                const asistenciaRef = doc(db, 'asistencias', docId);

                return setDoc(asistenciaRef, {
                    fecha: selectedDate,
                    materia_id: selectedMateriaId,
                    estudiante_id: estudianteId,
                    estado: estado
                });
            });

            await Promise.all(savePromises);
            this.setState({ mensaje: 'Asistencia guardada correctamente.' });

        } catch (error) {
            console.error("Error al guardar la asistencia:", error);
            this.setState({ mensaje: 'Error al guardar la asistencia.' });
        } finally {
            this.setState({ saving: false });
        }
    }

    render() {
        const { materias, docente, estudiantes, selectedMateriaId, selectedDate, asistencias, loadingDetalles, mensaje, saving } = this.state;

        return (
            <div className="registrar-asistencia-container">
                <div className="container-fluid p-4">
                    <h3 className="mb-4">Registrar Asistencia</h3>
                    
                    {/* Controles de selección */}
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
                                    <input type="date" id="fecha-select" className="form-control" value={selectedDate} onChange={e => this.setState({ selectedDate: e.target.value })} />
                                </div>
                                <div className="col-md-2">
                                    <button className="btn btn-primary w-100" onClick={this.handleGuardarAsistencia} disabled={saving || estudiantes.length === 0}>
                                        {saving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                            {docente && <p className="mt-3 mb-0"><strong>Docente:</strong> {docente}</p>}
                        </div>
                    </div>

                    {/* Mensaje de feedback */}
                    {mensaje && <div className={`alert ${mensaje.includes('Error') ? 'alert-danger' : 'alert-success'} mt-3`}>{mensaje}</div>}

                    {/* Tabla de estudiantes */}
                    <div className="card shadow-sm">
                        <div className="card-header">
                            Lista de Estudiantes ({estudiantes.length})
                        </div>
                        <div className="card-body">
                            {loadingDetalles ? <p>Cargando estudiantes...</p> : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
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
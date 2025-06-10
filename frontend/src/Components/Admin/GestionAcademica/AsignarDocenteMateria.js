// frontend/src/components/AsignarDocenteMateria.js
import React, { Component } from 'react';
import { 
  collection, 
  getDocs,
  query,
  where,
  addDoc,
  doc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../firebase';
import '../../../Styles/Admin/AsignarDocenteMateria.css';

class AsignarDocenteMateria extends Component {
  state = {
    docentes: [],        // lista de usuarios con rol 'docente'
    materias: [],        // todas las materias
    selectedDocente: '',
    assigned: [],        // [{ materia_id, nombre, student_count }]
    selectedMateria: '',
    mensaje: ''
  };

  async componentDidMount() {
    try {
      // 1) Cargar docentes
      const usuSnap = await getDocs(collection(db, 'usuarios'));
      const docentes = usuSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.rol === 'docente');

      // 2) Cargar materias
      const matSnap = await getDocs(collection(db, 'materias'));
      const materias = matSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      this.setState({ docentes, materias });
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  }

  // Cuando cambia el docente seleccionado
  handleDocenteChange = async (e) => {
    const selectedDocente = e.target.value;
    this.setState({ selectedDocente, mensaje: '', selectedMateria: '' });
    if (!selectedDocente) {
      this.setState({ assigned: [] });
      return;
    }

    // Consultar asignaciones de docente a materia
    const dmCol = collection(db, 'docente_materia');
    const q     = query(dmCol, where('docente_id', '==', selectedDocente));
    const dmSnap= await getDocs(q);

    // Para cada asignación obtener materia y contar estudiantes
    const tareas = dmSnap.docs.map(async dmDoc => {
      const { materia_id } = dmDoc.data();
      // obtener datos de materia
      const matDoc = await getDoc(doc(db, 'materias', materia_id));
      const nombre = matDoc.data().nombre;

      // contar inscritos en estudiante_materia
      const inscCol = collection(db, 'estudiante_materia');
      const q2      = query(inscCol, where('materia_id', '==', materia_id));
      const inscSnap= await getDocs(q2);
      const student_count = inscSnap.size;

      return { materia_id, nombre, student_count };
    });

    const assigned = await Promise.all(tareas);
    this.setState({ assigned });
  }

  handleMateriaChange = (e) => {
    this.setState({ selectedMateria: e.target.value });
  }

  assign = async () => {
    const { selectedDocente, selectedMateria } = this.state;
    if (!selectedDocente || !selectedMateria) return;
    try {
      await addDoc(collection(db, 'docente_materia'), {
        docente_id: selectedDocente,
        materia_id: selectedMateria,
        createdAt: serverTimestamp()
      });
      // refrescar asignaciones
      await this.handleDocenteChange({ target: { value: selectedDocente } });
      this.setState({ selectedMateria: '', mensaje: 'Asignación correcta' });
    } catch (err) {
      console.error('Error asignando docente a materia:', err);
      this.setState({ mensaje: 'No se pudo asignar.' });
    }
  }

  render() {
    const {
      docentes, materias,
      selectedDocente, assigned,
      selectedMateria, mensaje
    } = this.state;

    // Evitar duplicados
    const asignadasIds = assigned.map(a => a.materia_id);
    const disponibles  = materias.filter(m => !asignadasIds.includes(m.id));

    return (
      <>

        <div className="dashboard-layout">

          <main className="main-content asignar-docente-container">
            <div className="card p-4">
              <h3 className="mb-4">Asignar Docente a Materias</h3>

              <div className="row gx-3 align-items-end mb-3">
                <div className="col-md-5">
                  <label>Docente</label>
                  <select
                    className="form-select"
                    value={selectedDocente}
                    onChange={this.handleDocenteChange}
                  >
                    <option value="">-- Seleccionar --</option>
                    {docentes.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nombre} {d.apellido_paterno}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-5">
                  <label>Materia</label>
                  <select
                    className="form-select"
                    value={selectedMateria}
                    onChange={this.handleMateriaChange}
                    disabled={!selectedDocente || disponibles.length === 0}
                  >
                    <option value="">-- Seleccionar --</option>
                    {disponibles.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2 text-end">
                  <button
                    className="btn btn-primary"
                    onClick={this.assign}
                    disabled={!selectedDocente || !selectedMateria}
                  >Asignar</button>
                </div>
              </div>

              {mensaje && <div className="alert alert-info">{mensaje}</div>}

              {selectedDocente && (
                <div className="mt-4">
                  <h5>Materias Asignadas</h5>
                  <table className="table table-bordered mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Materia</th>
                        <th># Estudiantes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assigned.map(a => (
                        <tr key={a.materia_id}>
                          <td>{a.nombre}</td>
                          <td>{a.student_count}</td>
                        </tr>
                      ))}
                      {assigned.length === 0 && (
                        <tr>
                          <td colSpan="2" className="text-center text-muted">
                            No tiene materias asignadas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </>
    );
  }
}

export default AsignarDocenteMateria;

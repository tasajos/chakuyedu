// frontend/src/components/AsignarEstudiantes.js
import React, { Component } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  getDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../firebase';

import '../../../Styles/Admin/AsignarEstudiantes.css';

class AsignarEstudiantes extends Component {
  state = {
    estudiantes: [],
    materias: [],
    selectedStudent: '',
    assignedMaterias: [],  // [{ materia_id, nombre }]
    selectedMateria: '',
    mensaje: ''
  };

  async componentDidMount() {
    // Carga estudiantes y materias
    const usuariosCol = collection(db, 'usuarios');
    const matCol      = collection(db, 'materias');
    try {
      const [uSnap, mSnap] = await Promise.all([
        getDocs(query(usuariosCol, where('rol', '==', 'estudiante'))),
        getDocs(matCol)
      ]);

      const estudiantes = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const materias    = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.setState({ estudiantes, materias });
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  }

  handleStudentChange = async (e) => {
    const selectedStudent = e.target.value;
    this.setState({ selectedStudent, mensaje: '', selectedMateria: '' });
    if (!selectedStudent) {
      this.setState({ assignedMaterias: [] });
      return;
    }

    // Obtener inscripciones
    const inscCol = collection(db, 'estudiante_materia');
    const q       = query(inscCol, where('estudiante_id', '==', selectedStudent));
    const snap    = await getDocs(q);

    // Por cada inscripcion obtener nombre de materia
    const tareas = snap.docs.map(async docIns => {
      const { materia_id } = docIns.data();
      const matDoc = await getDoc(doc(db, 'materias', materia_id));
      return { materia_id, nombre: matDoc.data().nombre };
    });

    const assignedMaterias = await Promise.all(tareas);
    this.setState({ assignedMaterias });
  }

  handleMateriaChange = (e) => {
    this.setState({ selectedMateria: e.target.value });
  }

  assignMateria = async () => {
    const { selectedStudent, selectedMateria } = this.state;
    if (!selectedStudent || !selectedMateria) return;
    try {
      await addDoc(collection(db, 'estudiante_materia'), {
        estudiante_id: selectedStudent,
        materia_id: selectedMateria,
        createdAt: serverTimestamp()
      });
      // refrescar asignaciones
      await this.handleStudentChange({ target: { value: selectedStudent } });
      this.setState({ selectedMateria: '', mensaje: 'Asignación correcta' });
    } catch (err) {
      console.error('Error asignando materia:', err);
      this.setState({ mensaje: 'No se pudo asignar.' });
    }
  }

  render() {
    const {
      estudiantes, materias, selectedStudent,
      assignedMaterias, selectedMateria, mensaje
    } = this.state;

    // Filtrar materias disponibles
    const asignadasIds = assignedMaterias.map(a => a.materia_id);
    const disponibles  = materias.filter(m => !asignadasIds.includes(m.id));

    return (
      <>

        <div className="dashboard-layout">
       
          <main className="main-content asignar-estudiantes-container">
            <div className="card p-4">
              <h3 className="mb-4">Asignar Estudiantes a Materias</h3>

              <div className="row gx-3 align-items-end mb-3">
                <div className="col-md-5">
                  <label>Estudiante</label>
                  <select
                    className="form-select"
                    value={selectedStudent}
                    onChange={this.handleStudentChange}
                  >
                    <option value="">-- Seleccionar --</option>
                    {estudiantes.map(est => (
                      <option key={est.id} value={est.id}>
                        {est.nombre} {est.apellido_paterno}
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
                    disabled={!selectedStudent || disponibles.length === 0}
                  >
                    <option value="">-- Seleccionar --</option>
                    {disponibles.map(mat => (
                      <option key={mat.id} value={mat.id}>{mat.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 text-end">
                  <button
                    className="btn btn-success"
                    onClick={this.assignMateria}
                    disabled={!selectedStudent || !selectedMateria}
                  >Asignar</button>
                </div>
              </div>

              {mensaje && <div className="alert alert-info">{mensaje}</div>}

              {selectedStudent && (
                <div className="mt-4">
                  <h5>Materias Registradas</h5>
                  <ul className="list-group">
                    {assignedMaterias.map(am => (
                      <li key={am.materia_id} className="list-group-item">
                        {am.nombre}
                      </li>
                    ))}
                    {assignedMaterias.length === 0 && (
                      <li className="list-group-item text-muted">
                        No hay materias asignadas.
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </main>
        </div>
      </>
    );
  }
}

export default AsignarEstudiantes;

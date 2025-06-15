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
  // === 1. AÑADIMOS searchTerm AL ESTADO ===
  state = {
    estudiantes: [],      // Lista completa de todos los estudiantes
    materias: [],
    searchTerm: '',       // El texto que el usuario escribe en el buscador
    selectedStudent: '',
    assignedMaterias: [],
    selectedMateria: '',
    mensaje: ''
  };

  async componentDidMount() {
    const usuariosCol = collection(db, 'usuarios');
    const matCol = collection(db, 'materias');
    try {
      const [uSnap, mSnap] = await Promise.all([
        getDocs(query(usuariosCol, where('rol', '==', 'estudiante'))),
        getDocs(matCol)
      ]);
      const estudiantes = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const materias = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.setState({ estudiantes, materias });
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  }
  
  // === 2. NUEVO MÉTODO PARA MANEJAR EL CAMBIO EN EL BUSCADOR ===
  handleSearchChange = (e) => {
    this.setState({ 
      searchTerm: e.target.value,
      // Reseteamos la selección si el admin busca de nuevo
      selectedStudent: '',
      assignedMaterias: [] 
    });
  }

  handleStudentChange = async (e) => {
    const selectedStudentId = e.target.value;
    if (!selectedStudentId) {
      this.handleSearchChange({ target: { value: '' } }); // Limpia la búsqueda si deseleccionan
      return;
    }
    
    // === MEJORA UX: Muestra el nombre completo en el buscador al seleccionar ===
    const studentData = this.state.estudiantes.find(est => est.id === selectedStudentId);
    const studentFullName = studentData ? `${studentData.nombre} ${studentData.apellido_paterno} (${studentData.carnet_identidad})` : '';

    this.setState({ selectedStudent: selectedStudentId, mensaje: '', selectedMateria: '', searchTerm: studentFullName });

    const inscCol = collection(db, 'estudiante_materia');
    const q = query(inscCol, where('estudiante_id', '==', selectedStudentId));
    const snap = await getDocs(q);
    const tareas = snap.docs.map(async docIns => {
      const { materia_id } = docIns.data();
      const matDoc = await getDoc(doc(db, 'materias', materia_id));
      return { materia_id, nombre: matDoc.data()?.nombre || 'Materia eliminada' };
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
      // Comprobar si la asignación ya existe
      const q = query(collection(db, 'estudiante_materia'), 
        where('estudiante_id', '==', selectedStudent),
        where('materia_id', '==', selectedMateria)
      );
      const existingAssignment = await getDocs(q);
      if (!existingAssignment.empty) {
        this.setState({ mensaje: 'Este estudiante ya está inscrito en la materia.' });
        return;
      }

      await addDoc(collection(db, 'estudiante_materia'), {
        estudiante_id: selectedStudent,
        materia_id: selectedMateria,
        createdAt: serverTimestamp()
      });
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
      assignedMaterias, selectedMateria, mensaje, searchTerm
    } = this.state;

    // === 3. LÓGICA DE FILTRADO ANTES DE RENDERIZAR ===
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredEstudiantes = searchTerm.length < 2 ? [] : estudiantes.filter(est => {
      const fullName = `${est.nombre} ${est.apellido_paterno} ${est.apellido_materno}`.toLowerCase();
      const ci = est.carnet_identidad || '';
      return fullName.includes(lowercasedFilter) || ci.includes(lowercasedFilter);
    });

    const asignadasIds = assignedMaterias.map(a => a.materia_id);
    const disponibles = materias.filter(m => !asignadasIds.includes(m.id));

    return (
      <div className="dashboard-layout">
        <main className="main-content asignar-estudiantes-container">
          <div className="card p-4">
            <h3 className="mb-4">Asignar Estudiantes a Materias</h3>
            <div className="row gx-3 align-items-end mb-3">
              
              {/* === 4. CAMBIO EN LA UI: INPUT DE BÚSQUEDA + SELECTOR DE RESULTADOS === */}
              <div className="col-md-5">
                <label>Buscar Estudiante (por nombre, apellido o carnet)</label>
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Escribe para buscar..."
                  value={searchTerm}
                  onChange={this.handleSearchChange}
                />
                <select
                  className="form-select"
                  value={selectedStudent}
                  onChange={this.handleStudentChange}
                  disabled={!searchTerm}
                >
                  <option value="">-- Seleccionar de los resultados --</option>
                  {filteredEstudiantes.map(est => (
                    <option key={est.id} value={est.id}>
                      {`${est.nombre} ${est.apellido_paterno} (${est.carnet_identidad})`}
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
                    <li key={am.materia_id} className="list-group-item">{am.nombre}</li>
                  ))}
                  {assignedMaterias.length === 0 && (
                    <li className="list-group-item text-muted">No hay materias asignadas.</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }
}

export default AsignarEstudiantes;
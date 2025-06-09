// frontend/src/components/AsignarEstudiantes.js
import React, { Component } from 'react';
import axios from 'axios';

import '../../../Styles/Admin/AsignarEstudiantes.css';

class AsignarEstudiantes extends Component {
  state = {
    estudiantes: [],
    materias: [],
    selectedStudent: '',
    assignedMaterias: [],
    selectedMateria: '',
    mensaje: ''
  };

  async componentDidMount() {
    try {
      const [resEst, resMat] = await Promise.all([
        axios.get('http://localhost:5002/api/usuarios'),
        axios.get('http://localhost:5002/api/materias')
      ]);
      // Filtrar solo estudiantes
      const estudiantes = resEst.data.filter(u => u.rol === 'estudiante');
      this.setState({ estudiantes, materias: resMat.data });
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  }

  handleStudentChange = async (e) => {
    const selectedStudent = e.target.value;
    this.setState({ selectedStudent, mensaje: '', selectedMateria: '' });
    if (selectedStudent) {
      const res = await axios.get(
        `http://localhost:5002/api/inscripciones/${selectedStudent}`
      );
      this.setState({ assignedMaterias: res.data });
    } else {
      this.setState({ assignedMaterias: [] });
    }
  }

  handleMateriaChange = (e) => {
    this.setState({ selectedMateria: e.target.value });
  }

  assignMateria = async () => {
    const { selectedStudent, selectedMateria } = this.state;
    if (!selectedStudent || !selectedMateria) return;
    try {
      await axios.post('http://localhost:5002/api/inscripciones', {
        estudiante_id: Number(selectedStudent),
        materia_id: Number(selectedMateria)
      });
      // refrescar asignaciones
      const res = await axios.get(
        `http://localhost:5002/api/inscripciones/${selectedStudent}`
      );
      this.setState({ assignedMaterias: res.data, selectedMateria: '', mensaje: 'Asignación correcta' });
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

    // Evitar duplicar materias: extraer lista de IDs ya asignados
    const asignadasIds = assignedMaterias.map(am => am.materia_id);
    const disponibles = materias.filter(mat => !asignadasIds.includes(mat.id));

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

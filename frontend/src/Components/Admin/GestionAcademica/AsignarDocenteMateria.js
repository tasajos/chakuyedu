// frontend/src/components/AsignarDocenteMateria.js
import React, { Component } from 'react';
import axios from 'axios';
import '../../../Styles/Admin/AsignarDocenteMateria.css';

class AsignarDocenteMateria extends Component {
  state = {
    docentes: [],
    materias: [],
    selectedDocente: '',
    assigned: [],        // [{ materia_id, nombre, student_count }]
    selectedMateria: '',
    mensaje: ''
  };

  async componentDidMount() {
    try {
      const [resUsu, resMat] = await Promise.all([
        axios.get('http://localhost:5002/api/usuarios'),
        axios.get('http://localhost:5002/api/materias')
      ]);
      const docentes = resUsu.data.filter(u => u.rol === 'docente');
      this.setState({ docentes, materias: resMat.data });
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  }

  handleDocenteChange = async (e) => {
    const selectedDocente = e.target.value;
    this.setState({ selectedDocente, mensaje: '', selectedMateria: '' });
    if (selectedDocente) {
      const res = await axios.get(
        `http://localhost:5002/api/docente_materia/${selectedDocente}`
      );
      this.setState({ assigned: res.data });
    } else {
      this.setState({ assigned: [] });
    }
  }

  handleMateriaChange = (e) => {
    this.setState({ selectedMateria: e.target.value });
  }

  assign = async () => {
    const { selectedDocente, selectedMateria } = this.state;
    if (!selectedDocente || !selectedMateria) return;
    try {
      await axios.post('http://localhost:5002/api/docente_materia', {
        docente_id: Number(selectedDocente),
        materia_id: Number(selectedMateria)
      });
      // refrescar asignaciones
      const res = await axios.get(
        `http://localhost:5002/api/docente_materia/${selectedDocente}`
      );
      this.setState({ assigned: res.data, selectedMateria: '', mensaje: 'Asignación correcta' });
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

    // IDs ya asignados
    const asignadasIds = assigned.map(a => a.materia_id);
    const disponibles = materias.filter(m => !asignadasIds.includes(m.id));

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
                    disabled={!selectedDocente || disponibles.length===0}
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
                  <table className="table table-bordered">
                    <thead>
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
                      {assigned.length===0 && (
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


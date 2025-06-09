// frontend/src/components/ReporteDocentes.js
import React, { Component } from 'react';
import axios from 'axios';
import '../../../Styles/Admin/ReporteDocentes.css';

class ReporteDocentes extends Component {
  state = {
    reportes: [],
    loading: true,
    error: null
  };

  async componentDidMount() {
    try {
      const res = await axios.get('http://localhost:5002/api/reportes/docentes');
      this.setState({ reportes: res.data, loading: false });
    } catch (err) {
      console.error('Error cargando reporte:', err);
      this.setState({ error: 'No se pudo cargar el reporte.', loading: false });
    }
  }

  render() {
    const { reportes, loading, error } = this.state;

    return (
      <>
       
        <div className="dashboard-layout">
       
          <main className="main-content reporte-docentes-container">
            <div className="card p-4">
              <h3 className="mb-4">Reporte de Docentes</h3>

              {loading && <p>Cargando datos...</p>}
              {error && <div className="alert alert-danger">{error}</div>}

              {!loading && !error && (
                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead className="table-dark">
                      <tr>
                        <th>Docente</th>
                        <th>Materia</th>
                        <th>Cantidad de Estudiantes</th>
                        <th>Estudiantes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportes.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.docente_nombre}</td>
                          <td>{r.materia_nombre}</td>
                          <td>{r.student_count}</td>
                          <td>{r.students.join(', ')}</td>
                        </tr>
                      ))}
                      {reportes.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center text-muted">
                            No hay datos para mostrar.
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

export default ReporteDocentes;


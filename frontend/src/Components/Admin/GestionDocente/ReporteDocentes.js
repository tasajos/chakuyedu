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
            <div className="container-fluid p-4">
              <h3 className="mb-4">Reporte de Docentes</h3>

              {loading && <p>Cargando datos...</p>}
              {error && <div className="alert alert-danger">{error}</div>}

              {!loading && !error && reportes.map((r, idx) => (
                <div key={idx} className="card mb-4 reporte-card">
                  <div className="card-header bg-primary text-white">
                    <strong>Docente:</strong> {r.docente_nombre} &nbsp;|
                    &nbsp;<strong>Materia:</strong> {r.materia_nombre}
                  </div>
                  <div className="card-body">
                    <h5 className="mb-3">Estudiantes Inscritos ({r.student_count})</h5>
                    {r.student_count > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead className="table-dark">
                            <tr>
                              <th>Nro</th>
                              <th>Nombre</th>
                              <th>Apellido Paterno</th>
                              <th>Apellido Materno</th>
                              <th>Teléfono</th>
                              <th>Correo</th>
                              <th>CI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.students.map((s, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{s.nombre}</td>
                                <td>{s.apellido_paterno}</td>
                                <td>{s.apellido_materno}</td>
                                <td>{s.telefono}</td>
                                <td>{s.correo}</td>
                                <td>{s.ci}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted">No hay estudiantes inscritos.</p>
                    )}
                  </div>
                </div>
              ))}

              {(!loading && !error && reportes.length === 0) && (
                <div className="alert alert-info text-center">
                  No hay datos para mostrar.
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

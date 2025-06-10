// frontend/src/Components/Admin/GestionDocente/ReporteDocentes.js
import React, { Component } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../../firebase';


import '../../../Styles/Admin/ReporteDocentes.css';

class ReporteDocentes extends Component {
  state = {
    reportes: [],
    loading: true,
    error: null
  };

  async componentDidMount() {
    try {
      // 1) Leer todas las asignaciones de docente-materia
      const dmSnap = await getDocs(collection(db, 'docente_materia'));

      // 2) Para cada asignación, cargar datos y detalles
      const tareas = dmSnap.docs.map(async (dmDoc) => {
        const data = dmDoc.data();
        const { docente_id, materia_id } = data;

        // Validar rutas
        if (!docente_id || !materia_id) return null;

        // 3) Cargar perfil de docente
        const docenteSnap = await getDoc(doc(db, 'usuarios', docente_id));
        if (!docenteSnap.exists()) return null;
        const docenteData = docenteSnap.data();
        const docenteNombre = `${docenteData.nombre} ${docenteData.apellido_paterno} ${docenteData.apellido_materno}`;

        // 4) Cargar datos de materia
        const materiaSnap = await getDoc(doc(db, 'materias', materia_id));
        if (!materiaSnap.exists()) return null;
        const materiaData = materiaSnap.data();
        const materiaNombre = materiaData.nombre;

        // 5) Consultar estudiantes inscritos
        const inscQuery = query(
          collection(db, 'estudiante_materia'),
          where('materia_id', '==', materia_id)
        );
        const inscSnap = await getDocs(inscQuery);
        const studentCount = inscSnap.size;

        // 6) Detallar cada estudiante con todos sus campos
        const students = await Promise.all(
          inscSnap.docs.map(async (inscDoc) => {
            const estId = inscDoc.data().estudiante_id;
            if (!estId) return null;
            const estSnap = await getDoc(doc(db, 'usuarios', estId));
            if (!estSnap.exists()) return null;
            const u = estSnap.data();
            return {
              nombre: u.nombre || '',
              apellido_paterno: u.apellido_paterno || '',
              apellido_materno: u.apellido_materno || '',
              telefono: u.telefono || '',
              correo: u.correo || '',
              ci: u.carnet_identidad || ''
            };
          })
        );

        // Filtrar posibles nulls
        const validStudents = students.filter(Boolean);

        return {
          docente_nombre: docenteNombre,
          materia_nombre: materiaNombre,
          student_count: studentCount,
          students: validStudents
        };
      });

      const raw = await Promise.all(tareas);
      // Filtrar posibles nulls (asignaciones inválidas)
      const reportes = raw.filter(Boolean);

      this.setState({ reportes, loading: false });
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
              {error   && <div className="alert alert-danger">{error}</div>}

              {!loading && !error && reportes.map((r, idx) => (
                <div key={idx} className="card mb-4 reporte-card">
                  <div className="card-header bg-primary text-white">
                    <strong>Docente:</strong> {r.docente_nombre} &nbsp;|
                    &nbsp;<strong>Materia:</strong> {r.materia_nombre}
                  </div>
                  <div className="card-body">
                    <h5 className="mb-3">
                      Estudiantes Inscritos ({r.student_count})
                    </h5>
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

              {!loading && !error && reportes.length === 0 && (
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

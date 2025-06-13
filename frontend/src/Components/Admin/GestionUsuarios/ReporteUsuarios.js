// src/Components/Admin/GestionUsuarios/ReporteUsuarios.js

import React, { Component } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Users, UserCheck, ChevronDown } from 'lucide-react';
import '../../../Styles/Admin/ReporteUsuarios.css'; // Crearemos este archivo

class ReporteUsuarios extends Component {
  state = {
    stats: {
      totalEstudiantes: 0,
      totalDocentes: 0,
      porEstado: {},
    },
    materiasConDetalles: [],
    loading: true,
    error: null,
    activeAccordionKey: null, // Para controlar qué acordeón está abierto
  };

  // Función para mapear el número de estado a texto
  renderEstado = (estado) => {
    switch (Number(estado)) {
      case 1: return 'Habilitado';
      case 2: return 'Deshabilitado';
      case 3: return 'Habilitado con Observacion';
      case 4: return 'Deudas Pendientes';
      default: return 'Desconocido';
    }
  }

  async componentDidMount() {
    this.fetchReportData();
  }

  fetchReportData = async () => {
    this.setState({ loading: true, error: null });
    try {
      // --- 1. Obtener estadísticas de usuarios ---
      const usuariosSnap = await getDocs(collection(db, 'usuarios'));
      const stats = {
        totalEstudiantes: 0,
        totalDocentes: 0,
        porEstado: {},
      };

      usuariosSnap.forEach(doc => {
        const user = doc.data();
        if (user.rol === 'estudiante') {
          stats.totalEstudiantes++;
        } else if (user.rol === 'docente') {
          stats.totalDocentes++;
        }
        const estadoKey = user.estado || 2; // Si no tiene estado, se asume Deshabilitado
        stats.porEstado[estadoKey] = (stats.porEstado[estadoKey] || 0) + 1;
      });

      // --- 2. Obtener detalles de materias ---
      const materiasSnap = await getDocs(collection(db, 'materias'));
      
      const materiasPromises = materiasSnap.docs.map(async (materiaDoc) => {
        const materiaId = materiaDoc.id;
        const materiaData = materiaDoc.data();
        let docenteNombre = 'No asignado';
        let estudiantes = [];

        // Buscar docente
        const dmQuery = query(collection(db, 'docente_materia'), where('materia_id', '==', materiaId));
        const dmSnap = await getDocs(dmQuery);
        if (!dmSnap.empty) {
          const docenteId = dmSnap.docs[0].data().docente_id;
          const docenteSnap = await getDoc(doc(db, 'usuarios', docenteId));
          if(docenteSnap.exists()) {
            const d = docenteSnap.data();
            docenteNombre = `${d.nombre} ${d.apellido_paterno}`;
          }
        }

        // Buscar estudiantes
        const emQuery = query(collection(db, 'estudiante_materia'), where('materia_id', '==', materiaId));
        const emSnap = await getDocs(emQuery);
        if (!emSnap.empty) {
          const estPromises = emSnap.docs.map(emDoc => getDoc(doc(db, 'usuarios', emDoc.data().estudiante_id)));
          const estSnaps = await Promise.all(estPromises);
          estudiantes = estSnaps.map(snap => snap.exists() ? snap.data() : null).filter(Boolean);
        }

        return {
          id: materiaId,
          nombre: materiaData.nombre,
          docente: docenteNombre,
          estudiantes: estudiantes
        };
      });

      const materiasConDetalles = await Promise.all(materiasPromises);

      this.setState({ stats, materiasConDetalles, loading: false });

    } catch (err) {
      console.error("Error al generar el reporte:", err);
      this.setState({ error: 'No se pudo cargar la información del reporte.', loading: false });
    }
  }

  toggleAccordion = (key) => {
    this.setState(prevState => ({
      activeAccordionKey: prevState.activeAccordionKey === key ? null : key,
    }));
  }

  render() {
    const { stats, materiasConDetalles, loading, error, activeAccordionKey } = this.state;

    if (loading) {
      return <div className="reporte-container"><p>Generando reporte...</p></div>;
    }

    if (error) {
      return <div className="reporte-container"><div className="alert alert-danger">{error}</div></div>;
    }

    return (
      <div className="reporte-container">
        <h2 className="mb-4">Reporte General</h2>

        {/* --- Sección de Estadísticas Principales --- */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="stat-card">
              <div className="stat-icon students">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-title">Total Estudiantes</span>
                <span className="stat-value">{stats.totalEstudiantes}</span>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card">
              <div className="stat-icon teachers">
                <UserCheck size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-title">Total Docentes</span>
                <span className="stat-value">{stats.totalDocentes}</span>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card breakdown">
                <span className="stat-title mb-2">Usuarios por Estado</span>
                {Object.keys(stats.porEstado).map(estadoKey => (
                  <div key={estadoKey} className="breakdown-row">
                    <span>{this.renderEstado(estadoKey)}</span>
                    <span className="fw-bold">{stats.porEstado[estadoKey]}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* --- Sección de Acordeón para Materias --- */}
        <h3 className="mb-4">Detalle por Materia</h3>
        <div className="accordion-container">
          {materiasConDetalles.map(materia => (
            <div key={materia.id} className="accordion-item">
              <div className="accordion-header" onClick={() => this.toggleAccordion(materia.id)}>
                <div className="accordion-title">
                  <strong>{materia.nombre}</strong>
                  <small className="text-muted d-block">Docente: {materia.docente}</small>
                </div>
                <div className="accordion-summary">
                  <span className="badge bg-primary rounded-pill">{materia.estudiantes.length} Estudiantes</span>
                  <ChevronDown className={`accordion-chevron ${activeAccordionKey === materia.id ? 'open' : ''}`} size={20} />
                </div>
              </div>
              {activeAccordionKey === materia.id && (
                <div className="accordion-body">
                  {materia.estudiantes.length > 0 ? (
                    <table className="table table-sm table-striped">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Apellidos</th>
                          <th>Correo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materia.estudiantes.map((est, index) => (
                          <tr key={index}>
                            <td>{est.nombre}</td>
                            <td>{`${est.apellido_paterno} ${est.apellido_materno}`}</td>
                            <td>{est.correo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className="text-center text-muted m-3">No hay estudiantes inscritos en esta materia.</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default ReporteUsuarios;
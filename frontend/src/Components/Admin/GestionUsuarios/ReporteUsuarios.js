import React, { Component } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Users, UserCheck, ChevronDown } from 'lucide-react';
import '../../../Styles/Admin/ReporteUsuarios.css';

class ReporteUsuarios extends Component {
  state = {
    stats: {
      totalEstudiantes: 0,
      totalDocentes: 0,
      porEstado: {},
    },
    allUsers: [],
    materiasConDetalles: [],
    loading: true,
    error: null,
    activeAccordionKey: null,
    isModalOpen: false,
    modalTitle: '',
    usersInModal: [],
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
      // 1. Obtener todos los usuarios y guardarlos
      const usuariosSnap = await getDocs(collection(db, 'usuarios'));
      const allUsers = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Calcular estadísticas a partir de la lista de usuarios
      const stats = {
        totalEstudiantes: 0,
        totalDocentes: 0,
        porEstado: {},
      };

      allUsers.forEach(user => {
        if (user.rol === 'estudiante') {
          stats.totalEstudiantes++;
        } else if (user.rol === 'docente') {
          stats.totalDocentes++;
        }
        const estadoKey = user.estado || 2; // Asumir Deshabilitado si no hay estado
        stats.porEstado[estadoKey] = (stats.porEstado[estadoKey] || 0) + 1;
      });

      // 3. Obtener detalles de materias y sus inscripciones
      const materiasSnap = await getDocs(collection(db, 'materias'));
      
      const materiasPromises = materiasSnap.docs.map(async (materiaDoc) => {
        const materiaId = materiaDoc.id;
        const materiaData = materiaDoc.data();
        let docenteNombre = 'No asignado';
        let estudiantes = [];

        // Buscar docente asignado a la materia
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

        // Buscar estudiantes inscritos en la materia
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

      this.setState({ stats, materiasConDetalles, allUsers, loading: false });

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

  handleEstadoClick = (estadoKey) => {
    const { allUsers } = this.state;
    const estadoNumero = Number(estadoKey);
    
    const filteredUsers = allUsers.filter(user => (user.estado || 2) === estadoNumero);

    this.setState({
      isModalOpen: true,
      modalTitle: `Usuarios en estado: ${this.renderEstado(estadoNumero)}`,
      usersInModal: filteredUsers,
    });
  }

  closeModal = () => {
    this.setState({
      isModalOpen: false,
      modalTitle: '',
      usersInModal: [],
    });
  }

  render() {
    const { stats, materiasConDetalles, loading, error, activeAccordionKey, isModalOpen, modalTitle, usersInModal } = this.state;

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
                {Object.keys(stats.porEstado).sort().map(estadoKey => (
                  <div 
                    key={estadoKey} 
                    className="breakdown-row clickable"
                    onClick={() => this.handleEstadoClick(estadoKey)}
                  >
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
        
        {/* --- Modal para mostrar la lista de usuarios --- */}
        {isModalOpen && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{modalTitle}</h5>
                  <button type="button" className="btn-close" onClick={this.closeModal}></button>
                </div>
                <div className="modal-body">
                  {usersInModal.length > 0 ? (
                    <table className="table table-striped table-sm">
                      <thead>
                        <tr>
                          <th>Nombre Completo</th>
                          <th>Rol</th>
                          <th>Correo Electrónico</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersInModal.map(user => (
                          <tr key={user.id}>
                            <td>{`${user.nombre} ${user.apellido_paterno || ''} ${user.apellido_materno || ''}`}</td>
                            <td>{user.rol}</td>
                            <td>{user.correo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-muted">No hay usuarios en este estado.</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={this.closeModal}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default ReporteUsuarios;
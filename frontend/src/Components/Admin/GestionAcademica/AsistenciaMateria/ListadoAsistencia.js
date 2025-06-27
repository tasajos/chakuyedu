import React, { Component } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import SidebarMenu from '../../../SidebarMenu'; // Asegúrate que la ruta sea correcta
import { Search } from 'lucide-react';
import '../../../../Styles/Admin/ListadoAsistencia.css';

class ListadoAsistencia extends Component {
  state = {
    ciBusqueda: '',         // El CI que el admin escribe
    estudianteEncontrado: null, // Guardará los datos del estudiante encontrado
    historialAsistencia: [],  // Guardará la lista de sus asistencias
    loading: false,
    error: '',
    busquedaRealizada: false, // Para saber si ya se hizo una búsqueda
  };

  handleInputChange = (e) => {
    this.setState({ ciBusqueda: e.target.value });
  }

  handleSearch = async (e) => {
    e.preventDefault();
    const { ciBusqueda } = this.state;
    if (!ciBusqueda.trim()) {
      this.setState({ error: 'Por favor, ingrese un número de carnet.' });
      return;
    }

    this.setState({ loading: true, error: '', busquedaRealizada: true, estudianteEncontrado: null, historialAsistencia: [] });

    try {
      // 1. Buscar al estudiante en 'usuarios' por su carnet de identidad
      const qEstudiante = query(collection(db, 'usuarios'), where('carnet_identidad', '==', ciBusqueda));
      const estudianteSnap = await getDocs(qEstudiante);

      if (estudianteSnap.empty) {
        this.setState({ error: 'No se encontró ningún estudiante con ese carnet de identidad.', loading: false });
        return;
      }

      const estudianteDoc = estudianteSnap.docs[0];
      const estudianteData = { id: estudianteDoc.id, ...estudianteDoc.data() };
      this.setState({ estudianteEncontrado: estudianteData });

      // 2. Con el ID del estudiante, buscar todo su historial en 'asistencias'
      const qAsistencia = query(collection(db, 'asistencias'), where('estudiante_id', '==', estudianteData.id));
      const asistenciaSnap = await getDocs(qAsistencia);

      // 3. "Enriquecer" los datos de asistencia con el nombre de la materia
      const historialPromises = asistenciaSnap.docs.map(async (asistenciaDoc) => {
        const data = asistenciaDoc.data();
        const materiaSnap = await getDoc(doc(db, 'materias', data.materia_id));
        return {
          ...data,
          materiaNombre: materiaSnap.exists() ? materiaSnap.data().nombre : 'Materia Desconocida',
        };
      });

      const historialCompleto = await Promise.all(historialPromises);
      
      // Ordenar por fecha, de más reciente a más antiguo
      historialCompleto.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      
      this.setState({ historialAsistencia: historialCompleto, loading: false });

    } catch (error) {
      console.error("Error buscando asistencia:", error);
      this.setState({ error: 'Ocurrió un error al realizar la búsqueda.', loading: false });
    }
  }
  
  // Función para obtener la clase CSS según el estado de la asistencia
  getEstadoClass = (estado) => {
    switch (estado) {
      case 'presente': return 'text-success';
      case 'ausente': return 'text-danger';
      case 'permiso': return 'text-warning';
      default: return 'text-muted';
    }
  }

  render() {
    const { ciBusqueda, estudianteEncontrado, historialAsistencia, loading, error, busquedaRealizada } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Listado de Asistencia por Estudiante</h3>
            
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <form onSubmit={this.handleSearch}>
                  <div className="row g-2 align-items-end">
                    <div className="col-md-10">
                      <label htmlFor="ci-search" className="form-label">Buscar por Carnet de Identidad</label>
                      <input 
                        type="text" 
                        id="ci-search"
                        className="form-control" 
                        value={ciBusqueda}
                        onChange={this.handleInputChange}
                        placeholder="Ingrese el número de CI..."
                      />
                    </div>
                    <div className="col-md-2">
                      <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? 'Buscando...' : <><Search size={16} className="me-2"/>Buscar</>}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            
            {busquedaRealizada && !loading && estudianteEncontrado && (
              <div className="card shadow-sm">
                <div className="card-header">
                  Resultados para: <strong>{`${estudianteEncontrado.nombre} ${estudianteEncontrado.apellido_paterno}`}</strong>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-striped table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Fecha</th>
                          <th>Materia</th>
                          <th className="text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialAsistencia.length > 0 ? (
                          historialAsistencia.map((asistencia, index) => (
                            <tr key={index}>
                              <td>{asistencia.fecha}</td>
                              <td>{asistencia.materiaNombre}</td>
                              <td className={`text-center fw-bold ${this.getEstadoClass(asistencia.estado)}`}>
                                {asistencia.estado.charAt(0).toUpperCase() + asistencia.estado.slice(1)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center text-muted p-4">No se encontraron registros de asistencia para este estudiante.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {busquedaRealizada && !loading && !estudianteEncontrado && !error && (
                <div className="alert alert-warning">La búsqueda no produjo resultados.</div>
            )}
            
          </div>
        </main>
      </div>
    );
  }
}

export default ListadoAsistencia;
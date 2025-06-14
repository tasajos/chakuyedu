import React, { Component } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

import SidebarMenu from '../../SidebarMenu';
import { Users } from 'lucide-react';
import '../../../Styles/Docente/ListaEstudiantesMateria.css';

class ListaEstudiantesMateria extends Component {
  constructor(props) {
    super(props);
    this.state = {
      materia: null,
      estudiantes: [],
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    // Obtenemos el ID de la materia desde los parámetros de la URL
    const { materiaId } = this.props.params;
    if (materiaId) {
      this.fetchMateriaYEstudiantes(materiaId);
    } else {
      this.setState({ loading: false, error: 'No se especificó una materia.' });
    }
  }

  fetchMateriaYEstudiantes = async (materiaId) => {
    this.setState({ loading: true, error: null });
    try {
      // 1. Obtener los detalles de la materia para mostrar el nombre
      const matRef = doc(db, 'materias', materiaId);
      const matSnap = await getDoc(matRef);
      if (matSnap.exists()) {
        this.setState({ materia: matSnap.data() });
      } else {
        throw new Error('La materia no fue encontrada.');
      }

      // 2. Buscar en 'estudiante_materia' los estudiantes inscritos
      const emQuery = query(collection(db, 'estudiante_materia'), where('materia_id', '==', materiaId));
      const emSnap = await getDocs(emQuery);
      
      if (emSnap.empty) {
        this.setState({ loading: false, estudiantes: [] });
        return;
      }

      // 3. Por cada inscripción, obtener los detalles del estudiante desde 'usuarios'
      const estudiantesPromises = emSnap.docs.map(async (emDoc) => {
        const estudianteId = emDoc.data().estudiante_id;
        const userRef = doc(db, 'usuarios', estudianteId);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
      });

      const estudiantesCompletos = await Promise.all(estudiantesPromises);
      
      this.setState({
        estudiantes: estudiantesCompletos.filter(e => e !== null),
        loading: false,
      });

    } catch (e) {
      console.error("Error al obtener los estudiantes de la materia: ", e);
      this.setState({ error: 'No se pudieron cargar los datos.', loading: false });
    }
  }

  render() {
    const { loading, error, materia, estudiantes } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          {loading && <p>Cargando...</p>}
          {error && <p className="text-danger">{error}</p>}

          {!loading && !error && materia && (
            <div className="lista-estudiantes-container">
              <div className="gestion-header">
                <h2 className="mb-1">{materia.nombre}</h2>
                <p className="text-muted">Lista de estudiantes inscritos</p>
              </div>

              <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span>
                    <Users size={18} className="me-2" />
                    Estudiantes Inscritos ({estudiantes.length})
                  </span>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Nro</th>
                          <th>Nombre Completo</th>
                          <th>Email</th>
                          <th>Cédula de Identidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estudiantes.length > 0 ? (
                          estudiantes.map((est, index) => (
                            <tr key={est.id}>
                              <td>{index + 1}</td>
                              <td>{`${est.nombre} ${est.apellido_paterno} ${est.apellido_materno}`}</td>
                              <td>{est.correo}</td>
                              <td>{est.carnet_identidad}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted">
                              No hay estudiantes inscritos en esta materia.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }
}

// HOC para pasar los parámetros de la URL a un componente de clase
// eslint-disable-next-line import/no-anonymous-default-export
export default (props) => (
  <ListaEstudiantesMateria
    {...props}
    params={useParams()}
  />
);
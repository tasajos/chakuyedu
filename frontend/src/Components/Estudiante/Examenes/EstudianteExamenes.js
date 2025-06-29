import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import SidebarMenuEstudiante from '../../SidebarMenu';
import { Link } from 'react-router-dom'; 
import { FileText } from 'lucide-react';
import '../../../Styles/Estudiante/EstudianteExamenes.css';

class EstudianteExamenes extends Component {
  state = {
    examenesPendientes: [],
    loading: true,
    error: null,
    currentUser: null,
  };

  authSubscription = null;

  componentDidMount() {
    const auth = getAuth();
    this.authSubscription = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setState({ currentUser: user });
        this.loadExamenes(user.uid);
      } else {
        this.setState({ loading: false, error: 'Debe iniciar sesión.' });
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }

  loadExamenes = async (estudianteId) => {
    this.setState({ loading: true, error: null });
    try {
      const q = query(collection(db, 'estudiante_examen'), 
        where('estudiante_id', '==', estudianteId),
        where('estado', '==', 'pendiente')
      );
      const asigSnap = await getDocs(q);

      const examenesPromises = asigSnap.docs.map(async (asigDoc) => {
        const asignacion = { id: asigDoc.id, ...asigDoc.data() };
        
        const examenSnap = await getDoc(doc(db, 'examenes', asignacion.examen_id));
        const materiaSnap = await getDoc(doc(db, 'materias', asignacion.materia_id));

        return {
          ...asignacion,
          titulo: examenSnap.exists() ? examenSnap.data().titulo : 'Examen no encontrado',
          fecha_examen: examenSnap.exists() ? examenSnap.data().fecha_examen : 'N/A',
          duracion_minutos: examenSnap.exists() ? examenSnap.data().duracion_minutos : 'N/A',
          puntaje_total: examenSnap.exists() ? examenSnap.data().puntaje_total : 'N/A',
          materiaNombre: materiaSnap.exists() ? materiaSnap.data().nombre : 'Materia no encontrada',
        };
      });

      const examenesCompletos = await Promise.all(examenesPromises);
      this.setState({ examenesPendientes: examenesCompletos, loading: false });
    } catch (error) {
      console.error("Error cargando exámenes pendientes:", error);
      this.setState({ error: 'No se pudieron cargar los exámenes.', loading: false });
    }
  }

  render() {
    const { loading, error, examenesPendientes } = this.state;
    // La línea incorrecta ha sido eliminada de aquí

    return (
      <div className="dashboard-layout">
        <SidebarMenuEstudiante />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Exámenes Pendientes</h3>
            
            {loading && <p>Cargando exámenes...</p>}
            {error && <p className="text-danger">{error}</p>}

            {!loading && !error && (
              <div className="card shadow-sm">
                <div className="card-body p-0">
                  <ul className="list-group list-group-flush">
                    {examenesPendientes.length > 0 ? (
                      examenesPendientes.map(examen => (
                        <li key={examen.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <div className="icon-box-examen bg-light text-primary me-3">
                              <FileText size={24} />
                            </div>
                            <div>
                              <h6 className="mb-0">{examen.titulo}</h6>
                              <small className="text-muted">{examen.materiaNombre}</small>
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="d-block"><strong>Fecha:</strong> {examen.fecha_examen}</span>
                            <Link to={`/estudiante/examen/${examen.id}`} className="btn btn-primary btn-sm mt-2">
                              Rendir Examen
                            </Link>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="list-group-item text-center text-muted p-4">
                        ¡Felicidades! No tienes exámenes pendientes.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }
}

export default EstudianteExamenes;
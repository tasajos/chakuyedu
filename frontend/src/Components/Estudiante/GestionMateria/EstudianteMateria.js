import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, documentId } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Link } from 'react-router-dom';

import SidebarMenu from '../../SidebarMenu'; // Asumimos un menú para estudiantes
import { Book } from 'lucide-react';
import '../../../Styles/Estudiante/EstudianteMateria.css';

class EstudianteMaterias extends Component {
  state = {
    materiasInscritas: [],
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
        this.loadMisMaterias(user.uid);
      } else {
        this.setState({ loading: false, error: 'Debe iniciar sesión para ver sus materias.' });
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }

  loadMisMaterias = async (estudianteId) => {
    this.setState({ loading: true, error: null });
    try {
      // 1. Buscar en 'estudiante_materia' todas las inscripciones del estudiante
      const emQuery = query(collection(db, 'estudiante_materia'), where('estudiante_id', '==', estudianteId));
      const emSnap = await getDocs(emQuery);

      const materiaIds = emSnap.docs.map(d => d.data().materia_id);

      if (materiaIds.length === 0) {
        // El estudiante no está inscrito en ninguna materia
        this.setState({ loading: false, materiasInscritas: [] });
        return;
      }

      // 2. Con los IDs, buscar los detalles de todas esas materias a la vez
      const materiasQuery = query(collection(db, 'materias'), where(documentId(), 'in', materiaIds));
      const materiasSnap = await getDocs(materiasQuery);

      const materiasList = materiasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.setState({ materiasInscritas: materiasList, loading: false });

    } catch (error) {
      console.error("Error al cargar las materias del estudiante:", error);
      this.setState({ error: 'No se pudieron cargar las materias.', loading: false });
    }
  }

  render() {
    const { loading, error, materiasInscritas } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Mis Materias</h3>
            
            {loading && <p>Cargando tus materias...</p>}
            {error && <p className="text-danger">{error}</p>}

            {!loading && !error && (
              materiasInscritas.length > 0 ? (
                <div className="materias-grid-estudiante">
                  {materiasInscritas.map(materia => (
                    // Cada tarjeta es un link a una futura página de detalles de la materia
                    <Link to={`/estudiante/materia/${materia.id}`} key={materia.id} className="text-decoration-none">
                      <div className="materia-card-estudiante" style={{ '--materia-color': materia.color || '#0d6efd' }}>
                        <div className="card-estudiante-icon">
                          <Book size={28} />
                        </div>
                        <div className="card-estudiante-body">
                          <h5 className="card-title">{materia.nombre}</h5>
                          <p className="card-description">{materia.descripcion}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info">
                  No estás inscrito en ninguna materia en este momento.
                </div>
              )
            )}
          </div>
        </main>
      </div>
    );
  }
}

export default EstudianteMaterias;
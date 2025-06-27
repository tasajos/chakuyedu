import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase'; 

import SidebarMenu from '../../SidebarMenu';
import { BookMarked } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../../Styles/Docente/GestionMaterias.css';

class GestionMaterias extends Component {
  constructor(props) {
    super(props);
    this.state = {
      materiasAsignadas: [],
      loading: true,
      error: null,
      currentUser: null,
    };
    this.authSubscription = null;
  }

  componentDidMount() {
    const auth = getAuth();
    this.authSubscription = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setState({ currentUser: user });
        this.fetchMaterias(user.uid);
      } else {
        this.setState({ currentUser: null, loading: false, error: 'Debe iniciar sesión para ver sus materias.' });
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) {
      this.authSubscription();
    }
  }

  fetchMaterias = async (docenteId) => {
    this.setState({ loading: true, error: null });
    try {
      const dmQuery = query(collection(db, 'docente_materia'), where('docente_id', '==', docenteId));
      const dmSnap = await getDocs(dmQuery);

      if (dmSnap.empty) {
        this.setState({ loading: false, materiasAsignadas: [] });
        return;
      }

      const materiasPromises = dmSnap.docs.map(async (dmDoc) => {
        const materiaId = dmDoc.data().materia_id;
        const matRef = doc(db, 'materias', materiaId);
        const matSnap = await getDoc(matRef);

        if (matSnap.exists()) {
          return { id: matSnap.id, ...matSnap.data() };
        }
        return null;
      });
      
      const materiasCompletas = await Promise.all(materiasPromises);
      
      this.setState({
        materiasAsignadas: materiasCompletas.filter(m => m !== null),
        loading: false,
      });

    } catch (e) {
      console.error("Error al obtener las materias: ", e);
      this.setState({ error: 'No se pudieron cargar las materias.', loading: false });
    }
  }

  render() {
    const { loading, error, materiasAsignadas } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <div className="gestion-header">
              <h2 className="mb-4">Mis Materias Asignadas</h2>
              <p className="text-muted">Aquí puedes ver todas las materias que tienes a tu cargo y gestionar sus actividades.</p>
            </div>
            
            <div className="materias-container">
              {loading && <p>Cargando materias...</p>}
              {error && <p className="text-danger">{error}</p>}
              
              {!loading && !error && (
                materiasAsignadas.length > 0 ? (
                  <div className="materias-grid">
                    {materiasAsignadas.map(materia => (
                      <div className="materia-card" key={materia.id} style={{ '--materia-color': materia.color || '#3b82f6' }}>
                        <div className="card-icon">
                          <BookMarked size={24} />
                        </div>
                        <div className="card-body-custom">
                          <h5 className="card-title">{materia.nombre}</h5>
                          <p className="card-description">{materia.descripcion}</p>
                        </div>
                       
                      <div className="card-footer-custom d-flex justify-content-end gap-2">
                      <Link to={`/docente/materia/${materia.id}`} className="btn btn-sm btn-outline-primary">
                      Ver Detalles
                      </Link>
                      <Link to={`/docente/materia/${materia.id}/crear-examen`} className="btn btn-sm btn-primary">
                      Crear Examen
                    </Link>
                    </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-info">
                    No tienes ninguna materia asignada en este momento.
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default GestionMaterias;
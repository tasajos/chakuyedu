import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase'; // Asegúrate que la ruta a tu config de firebase sea correcta

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
    this.authSubscription = null; // Para guardar la suscripción de auth
  }

  componentDidMount() {
    const auth = getAuth();
    // Escuchamos cambios en el estado de autenticación
    this.authSubscription = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Si hay un usuario logueado, lo guardamos y buscamos sus materias
        this.setState({ currentUser: user });
        this.fetchMaterias(user.uid);
      } else {
        // Si no hay usuario, limpiamos el estado
        this.setState({ currentUser: null, loading: false, error: 'Debe iniciar sesión para ver sus materias.' });
      }
    });
  }

  componentWillUnmount() {
    // Es importante cancelar la suscripción al desmontar el componente para evitar memory leaks
    if (this.authSubscription) {
      this.authSubscription();
    }
  }

  // Método para obtener las materias desde Firestore
  fetchMaterias = async (docenteId) => {
    this.setState({ loading: true, error: null });
    try {
      // 1. Buscar en 'docente_materia' las asignaciones para el docente actual
      const dmQuery = query(collection(db, 'docente_materia'), where('docente_id', '==', docenteId));
      const dmSnap = await getDocs(dmQuery);

      if (dmSnap.empty) {
        // Si no hay asignaciones, terminamos la carga
        this.setState({ loading: false, materiasAsignadas: [] });
        return;
      }

      // 2. Por cada asignación, obtener los detalles de la materia
      const materiasPromises = dmSnap.docs.map(async (dmDoc) => {
        const materiaId = dmDoc.data().materia_id;
        const matRef = doc(db, 'materias', materiaId);
        const matSnap = await getDoc(matRef);

        if (matSnap.exists()) {
          // Devolvemos un objeto con el id y los datos de la materia
          return { id: matSnap.id, ...matSnap.data() };
        }
        return null; // En caso de que una materia haya sido borrada
      });
      
      const materiasCompletas = await Promise.all(materiasPromises);
      
      // Filtramos cualquier resultado nulo y actualizamos el estado
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
          <div className="gestion-header">
            <h2 className="mb-4">Mis Materias Asignadas</h2>
            <p className="text-muted">Aquí puedes ver todas las materias que tienes a tu cargo.</p>
          </div>
          
          <div className="materias-container">
            {loading && <p>Cargando materias...</p>}
            {error && <p className="text-danger">{error}</p>}
            
            {!loading && !error && (
              materiasAsignadas.length > 0 ? (
                <div className="materias-grid">
                  {materiasAsignadas.map(materia => (


                   <Link to={`/docente/materia/${materia.id}`} key={materia.id} className="text-decoration-none">
                      <div className="materia-card" style={{ '--materia-color': materia.color || '#3b82f6' }}>
                        <div className="card-icon">
                          <BookMarked size={24} />
                        </div>
                        <h5 className="card-title">{materia.nombre}</h5>
                        <p className="card-description">{materia.descripcion}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p>No tienes ninguna materia asignada en este momento.</p>
              )
            )}
          </div>
        </main>
      </div>
    );
  }
}
export default GestionMaterias;
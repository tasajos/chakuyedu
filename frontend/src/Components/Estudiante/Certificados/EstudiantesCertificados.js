import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, documentId } from 'firebase/firestore';
import { db } from '../../../firebase';
import SidebarMenuEstudiante from '../../SidebarMenu';
import { Award } from 'lucide-react';
import '../../../Styles/Estudiante/EstudianteCertificados.css';

class EstudianteCertificados extends Component {
  state = {
    certificados: [], // Guardará las materias aprobadas con sus detalles
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
        this.loadCertificados(user.uid);
      } else {
        this.setState({ loading: false, error: 'Debe iniciar sesión.' });
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }

  loadCertificados = async (estudianteId) => {
    this.setState({ loading: true, error: null });
    try {
      // 1. Obtener todas las calificaciones finales del estudiante
      const cfQuery = query(collection(db, 'calificaciones_finales'), where('estudiante_id', '==', estudianteId));
      const cfSnap = await getDocs(cfQuery);

      // 2. Filtrar solo las materias aprobadas (nota >= 51)
      const aprobadas = cfSnap.docs
        .map(d => d.data())
        .filter(c => c.nota_final >= 51);

      if (aprobadas.length === 0) {
        this.setState({ loading: false, certificados: [] });
        return;
      }

      // 3. Obtener los detalles de cada materia aprobada
      const materiaIds = aprobadas.map(a => a.materia_id);
      const materiasQuery = query(collection(db, 'materias'), where(documentId(), 'in', materiaIds));
      const materiasSnap = await getDocs(materiasQuery);
      
      const materiasMap = {};
      materiasSnap.docs.forEach(doc => {
        materiasMap[doc.id] = doc.data();
      });

      // 4. Unir la información de la materia con su calificación final
      const certificadosCompletos = aprobadas.map(aprobada => ({
        ...aprobada,
        materia: materiasMap[aprobada.materia_id] || { nombre: 'Materia Desconocida' }
      }));
      
      this.setState({ certificados: certificadosCompletos, loading: false });

    } catch (error) {
      console.error("Error al cargar certificados:", error);
      this.setState({ error: 'No se pudieron cargar tus logros.', loading: false });
    }
  }

  render() {
    const { loading, error, certificados } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenuEstudiante />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Mis Certificados y Badges</h3>

            {loading && <p>Buscando tus logros...</p>}
            {error && <p className="text-danger">{error}</p>}

            {!loading && !error && (
              certificados.length > 0 ? (
                <div className="badge-grid">
                  {certificados.map(cert => (
                    <div className="badge-card" key={cert.materia_id}>
                      <div className="badge-hexagon" style={{ '--badge-color': cert.materia.color || '#0d6efd' }}>
                        <Award size={48} />
                      </div>
                      <h5 className="badge-title">{cert.materia.nombre}</h5>
                      <p className="badge-issuer">Otorgado por Chakuy Soft</p>
                      <p className="badge-grade">Nota Final: <strong>{cert.nota_final}</strong></p>
                      <button className="btn btn-sm btn-outline-primary mt-2" disabled>
                        Ver Certificado
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info">
                  Aún no has obtenido ningún certificado. ¡Sigue esforzándote!
                </div>
              )
            )}
          </div>
        </main>
      </div>
    );
  }
}

export default EstudianteCertificados;
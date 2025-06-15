import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, documentId, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import SidebarMenuEstudiante from '../../SidebarMenu';
import { Award } from 'lucide-react';
import '../../../Styles/Estudiante/EstudianteCertificados.css';

class EstudianteCertificados extends Component {
  state = {
    certificados: [],
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
        this.procesarYcargarCertificados(user.uid);
      } else {
        this.setState({ loading: false, error: 'Debe iniciar sesión.' });
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }

  procesarYcargarCertificados = async (estudianteId) => {
    this.setState({ loading: true, error: null });
    try {
      const [cfSnap, certSnap] = await Promise.all([
        getDocs(query(collection(db, 'calificaciones_finales'), where('estudiante_id', '==', estudianteId), where('nota_final', '>=', 51))),
        getDocs(query(collection(db, 'certificados_obtenidos'), where('estudiante_id', '==', estudianteId)))
      ]);

      const aprobadas = cfSnap.docs.map(d => d.data());
      const certificadosExistentes = certSnap.docs.map(d => d.data());
      const idsMateriasYaCertificadas = new Set(certificadosExistentes.map(c => c.materia_id));

      const nuevasAprobadas = aprobadas.filter(ap => !idsMateriasYaCertificadas.has(ap.materia_id));

      if (nuevasAprobadas.length > 0) {
        const materiaIdsNuevas = nuevasAprobadas.map(a => a.materia_id);
        const materiasQuery = query(collection(db, 'materias'), where(documentId(), 'in', materiaIdsNuevas));
        const materiasSnap = await getDocs(materiasQuery);
        
        const materiasMap = {};
        materiasSnap.docs.forEach(doc => { materiasMap[doc.id] = doc.data(); });
        
        const batch = writeBatch(db);
        const certificadosRecienCreados = []; // Array para guardar los nuevos certs localmente

        nuevasAprobadas.forEach(aprobada => {
          const materiaData = materiasMap[aprobada.materia_id];
          if (materiaData) {
            const newCertRef = doc(collection(db, 'certificados_obtenidos'));
            const nuevoCertificado = { // Creamos el objeto del nuevo certificado
              estudiante_id: estudianteId,
              materia_id: aprobada.materia_id,
              materia_nombre: materiaData.nombre,
              facultad: materiaData.facultad || 'Institución Académica',
              color: materiaData.color || '#0d6efd',
              nota_final_obtenida: aprobada.nota_final,
              fecha_emision: new Date(), // Usamos la fecha actual para la UI inmediata
            };
            certificadosRecienCreados.push(nuevoCertificado);

            // En el batch, usamos serverTimestamp para la precisión del servidor
            batch.set(newCertRef, {
                ...nuevoCertificado,
                fecha_emision: serverTimestamp(),
            });
          }
        });
        
        await batch.commit();
        
        // === LÓGICA CORREGIDA ===
        // Unimos los certificados que ya existían con los que acabamos de crear
        const listaCompleta = [...certificadosExistentes, ...certificadosRecienCreados];
        this.setState({ certificados: listaCompleta, loading: false });
        
      } else {
        // Si no hay nuevos, solo mostramos los existentes
        this.setState({ certificados: certificadosExistentes, loading: false });
      }

    } catch (error) {
      console.error("Error procesando certificados:", error);
      this.setState({ error: 'No se pudieron procesar tus logros.', loading: false });
    }
  }

  // La función loadCertificadosEmitidos ya no es necesaria, la lógica está unificada arriba
  
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
                      <div className="badge-hexagon" style={{ '--badge-color': cert.color }}>
                        <Award size={48} />
                      </div>
                      <h5 className="badge-title">{cert.materia_nombre}</h5>
                      <p className="badge-issuer">Otorgado por: {cert.facultad}</p>
                      <p className="badge-grade">Nota Final: <strong>{Number(cert.nota_final_obtenida).toFixed(2)}</strong></p>
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
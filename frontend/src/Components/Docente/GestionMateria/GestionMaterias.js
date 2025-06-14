import React, { Component } from 'react';
import SidebarMenu from '../../SidebarMenu';
import { BookMarked } from 'lucide-react';
import '../../../Styles/Docente/GestionMaterias.css';

// --- SIMULACIÓN DE DATOS ---
// En una aplicación real, estos datos vendrían de tu base de datos (API).

// 1. SIMULAMOS UN USUARIO LOGUEADO
const mockCurrentUser = {
  userId: 'docente001',
  nombre: 'Carlos Zúñiga'
};

// 2. SIMULAMOS UNA LISTA COMPLETA DE MATERIAS DE LA BASE DE DATOS
const mockTodasLasMaterias = [
  { id: 'mat01', nombre: 'Cálculo I', descripcion: 'Fundamentos del cálculo diferencial e integral.', docenteId: 'docente001', color: '#3b82f6' },
  { id: 'mat02', nombre: 'Álgebra Lineal', descripcion: 'Vectores, matrices y espacios vectoriales.', docenteId: 'docente002', color: '#10b981' },
  { id: 'mat03', nombre: 'Programación Avanzada', descripcion: 'Patrones de diseño y estructuras de datos complejas.', docenteId: 'docente001', color: '#f97316' },
  { id: 'mat04', nombre: 'Física II', descripcion: 'Electromagnetismo y principios de termodinámica.', docenteId: 'docente003', color: '#8b5cf6' },
  { id: 'mat05', nombre: 'Bases de Datos', descripcion: 'Diseño, modelado y consulta de bases de datos relacionales.', docenteId: 'docente001', color: '#ef4444' }
];

class GestionMaterias extends Component {
  constructor(props) {
    super(props);
    this.state = {
      materiasAsignadas: [],
      loading: true,
      error: null
    };
  }

  componentDidMount() {
    // 3. SIMULAMOS LA "LLAMADA A LA API"
    // Usamos un setTimeout para simular el tiempo de espera de una red.
    setTimeout(() => {
      try {
        const materiasDelDocente = mockTodasLasMaterias.filter(
          materia => materia.docenteId === mockCurrentUser.userId
        );
        this.setState({ materiasAsignadas: materiasDelDocente, loading: false });
      } catch (e) {
        this.setState({ error: 'No se pudieron cargar las materias.', loading: false });
      }
    }, 1000); // 1 segundo de espera simulado
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
                    <div className="materia-card" key={materia.id} style={{ '--materia-color': materia.color }}>
                      <div className="card-icon">
                        <BookMarked size={24} />
                      </div>
                      <h5 className="card-title">{materia.nombre}</h5>
                      <p className="card-description">{materia.descripcion}</p>
                    </div>
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
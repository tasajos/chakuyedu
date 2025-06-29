import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarMenuEstudiante from '../../SidebarMenu';
import '../../../Styles/Estudiante/RendirExamen.css';

class RendirExamen extends Component {
  state = {
    examen: null,
    asignacion: null,
    respuestas: {}, // Ej: { preguntaId1: 'si', preguntaId2: { opcionId1: true } }
    tiempoRestante: 0,
    loading: true,
    error: '',
    examenFinalizado: false,
    puntajeObtenido: 0,
  };

  timer = null;

  componentDidMount() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.loadExamen();
      }
    });
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }

  loadExamen = async () => {
    const { asignacionId } = this.props.params;
    try {
      // 1. Cargar la asignación del examen
      const asigRef = doc(db, 'estudiante_examen', asignacionId);
      const asigSnap = await getDoc(asigRef);
      if (!asigSnap.exists() || asigSnap.data().estado !== 'pendiente') {
        this.setState({ error: 'Este examen no está disponible o ya fue rendido.', loading: false });
        return;
      }
      const asignacion = asigSnap.data();

      // 2. Cargar los detalles y preguntas del examen
      const examenRef = doc(db, 'examenes', asignacion.examen_id);
      const examenSnap = await getDoc(examenRef);
      if (!examenSnap.exists()) {
        this.setState({ error: 'No se encontraron los detalles del examen.', loading: false });
        return;
      }
      
      const examen = examenSnap.data();
      this.setState({ examen, asignacion, loading: false, tiempoRestante: examen.duracion_minutos * 60 }, this.iniciarTimer);

    } catch (error) {
      this.setState({ error: 'Error al cargar el examen.', loading: false });
    }
  }

  iniciarTimer = () => {
    this.timer = setInterval(() => {
      this.setState(prevState => {
        if (prevState.tiempoRestante <= 1) {
          clearInterval(this.timer);
          this.handleFinalizarExamen(); // Enviar automáticamente cuando el tiempo se acaba
          return { tiempoRestante: 0 };
        }
        return { tiempoRestante: prevState.tiempoRestante - 1 };
      });
    }, 1000);
  }

  handleRespuestaChange = (preguntaId, tipo, valor, opcionId = null) => {
    this.setState(prevState => {
      const nuevasRespuestas = { ...prevState.respuestas };
      if (tipo === 'si_no') {
        nuevasRespuestas[preguntaId] = valor;
      } else if (tipo === 'multiple') {
        if (!nuevasRespuestas[preguntaId]) nuevasRespuestas[preguntaId] = {};
        nuevasRespuestas[preguntaId][opcionId] = valor;
      }
      return { respuestas: nuevasRespuestas };
    });
  }

  handleFinalizarExamen = async () => {
    if (this.timer) clearInterval(this.timer);
    this.setState({ loading: true });

    const { examen, respuestas } = this.state;
    let puntaje = 0;

    // Calcular puntaje
    examen.preguntas.forEach(p => {
      const respuestaUsuario = respuestas[p.id];
      if (p.tipo === 'si_no' && respuestaUsuario === p.respuestaCorrecta) {
        puntaje += 1;
      } else if (p.tipo === 'multiple') {
        const opcionesCorrectas = p.opciones.filter(opt => opt.esCorrecta);
        const opcionesMarcadasCorrectas = p.opciones.filter(opt => opt.esCorrecta && respuestaUsuario?.[opt.id]);
        const opcionesMarcadasIncorrectas = p.opciones.filter(opt => !opt.esCorrecta && respuestaUsuario?.[opt.id]);

        if (opcionesCorrectas.length === opcionesMarcadasCorrectas.length && opcionesMarcadasIncorrectas.length === 0) {
          puntaje += 2;
        }
      }
    });

    // Guardar resultados en Firestore
    const { asignacionId } = this.props.params;
    const asigRef = doc(db, 'estudiante_examen', asignacionId);
    try {
      await updateDoc(asigRef, {
        estado: 'finalizado',
        calificacion_obtenida: puntaje,
        respuestas: respuestas,
        fecha_finalizacion: serverTimestamp()
      });
      this.setState({ examenFinalizado: true, puntajeObtenido: puntaje, loading: false });
    } catch (error) {
      this.setState({ error: 'Error al guardar tu examen.', loading: false });
    }
  }

  render() {
  const { loading, error, examen, tiempoRestante, respuestas, examenFinalizado, puntajeObtenido } = this.state;

  if (loading) return <div className="dashboard-layout"><SidebarMenuEstudiante /><main className="main-content p-4"><p>Cargando examen...</p></main></div>;
  if (error) return <div className="dashboard-layout"><SidebarMenuEstudiante /><main className="main-content p-4"><div className="alert alert-danger">{error}</div></main></div>;

  if (examenFinalizado) {
    return (
      <div className="dashboard-layout">
        <SidebarMenuEstudiante />
        <main className="main-content d-flex justify-content-center align-items-center">
          <div className="card text-center shadow-sm p-5">
            <h3>¡Examen Finalizado!</h3>
            <p className="lead">Has obtenido un puntaje de:</p>
            <h1 className="display-1 text-primary">{puntajeObtenido} / {examen.puntaje_total}</h1>
            <p className="text-muted">Serás redirigido en 5 segundos...</p>
            {setTimeout(() => this.props.navigate('/Estudiante/Examenes/EstudianteExamenes'), 5000)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <SidebarMenuEstudiante />
      <main className="main-content">
        <div className="container-fluid p-4">
          <div className="examen-header">
            <h3>{examen.titulo}</h3>
            <div className="timer">
              Tiempo Restante: {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="examen-body">
            {examen.preguntas.map((p, index) => (
              <div key={p.id} className="card pregunta-container shadow-sm mb-4">
                <div className="card-header"><strong>Pregunta {index + 1}:</strong> {p.texto}</div>
                <div className="card-body">
                  {p.tipo === 'si_no' && (
                    <div className="d-flex gap-4">
                      <div className="form-check"><input type="radio" className="form-check-input" name={`resp-${p.id}`} onChange={() => this.handleRespuestaChange(p.id, 'si_no', 'si')} /> Sí</div>
                      <div className="form-check"><input type="radio" className="form-check-input" name={`resp-${p.id}`} onChange={() => this.handleRespuestaChange(p.id, 'si_no', 'no')} /> No</div>
                    </div>
                  )}
                  {p.tipo === 'multiple' && (
                    <div>
                      {p.opciones.map(opt => (
                        <div key={opt.id} className="form-check">
                          <input className="form-check-input" type="checkbox" id={opt.id} onChange={(e) => this.handleRespuestaChange(p.id, 'multiple', e.target.checked, opt.id)} />
                          <label className="form-check-label" htmlFor={opt.id}>{opt.texto}</label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-success btn-lg w-100 mt-4" onClick={this.handleFinalizarExamen}>
            Finalizar y Entregar Examen
          </button>
        </div>
      </main>
    </div>
  );
}
}

// ... HOC para los hooks de router
function RendirExamenConRouter(props) {
  return <RendirExamen {...props} params={useParams()} navigate={useNavigate()} />;
}
export default RendirExamenConRouter;
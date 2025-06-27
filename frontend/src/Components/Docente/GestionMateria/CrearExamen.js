import React, { Component } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarMenu from '../../SidebarMenu';
import Modal from '../../Utils/Modal'; // Usando el modal de react-bootstrap
import { Button } from 'react-bootstrap';
import { PlusCircle, Trash2 } from 'lucide-react';
import '../../../Styles/Docente/CrearExamen.css';

class CrearExamen extends Component {
  state = {
    materia: null,
    currentUser: null,
    // Info General del Examen
    titulo: '',
    descripcion: '',
    fechaExamen: '',
    duracionMinutos: '',
    // Constructor de Preguntas
    preguntas: [],
    // Estado del Modal
    isConfirmModalOpen: false,
    puntajeCalculado: 0,
    // UI State
    saving: false, 
    error: '',
    success: '',
  };

  authSubscription = null;

  componentDidMount() {
    const auth = getAuth();
    this.authSubscription = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setState({ currentUser: user });
        this.fetchMateria();
      } else {
        this.props.navigate('/login');
      }
    });
  }

  componentWillUnmount() {
    if (this.authSubscription) this.authSubscription();
  }

  fetchMateria = async () => {
    const { materiaId } = this.props.params;
    const matRef = doc(db, 'materias', materiaId);
    const matSnap = await getDoc(matRef);
    if (matSnap.exists()) {
      this.setState({ materia: matSnap.data() });
    } else {
      this.setState({ error: 'Materia no encontrada.' });
    }
  }

  handleInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  // === LÓGICA DEL CONSTRUCTOR DE EXÁMENES ===

  handleAgregarPregunta = (tipo) => {
    const nuevaPregunta = {
      id: `q-${Date.now()}`,
      tipo: tipo,
      texto: '',
    };
    if (tipo === 'si_no') {
      nuevaPregunta.respuestaCorrecta = 'si';
    } else if (tipo === 'multiple') {
      nuevaPregunta.opciones = [
        { id: `opt-${Date.now()}-1`, texto: '', esCorrecta: false },
        { id: `opt-${Date.now()}-2`, texto: '', esCorrecta: false },
      ];
    }
    this.setState(prevState => ({
      preguntas: [...prevState.preguntas, nuevaPregunta]
    }));
  }

  handleEliminarPregunta = (preguntaId) => {
    this.setState(prevState => ({
      preguntas: prevState.preguntas.filter(p => p.id !== preguntaId)
    }));
  }

  handlePreguntaTextoChange = (preguntaId, nuevoTexto) => {
    this.setState(prevState => ({
      preguntas: prevState.preguntas.map(p => 
        p.id === preguntaId ? { ...p, texto: nuevoTexto } : p
      )
    }));
  }

  handleRespuestaCorrectaChange = (preguntaId, nuevaRespuesta) => {
    this.setState(prevState => ({
      preguntas: prevState.preguntas.map(p =>
        p.id === preguntaId ? { ...p, respuestaCorrecta: nuevaRespuesta } : p
      )
    }));
  }
  
  handleAgregarOpcion = (preguntaId) => {
    this.setState(prevState => ({
      preguntas: prevState.preguntas.map(p => {
        if (p.id === preguntaId) {
          const nuevaOpcion = { id: `opt-${Date.now()}`, texto: '', esCorrecta: false };
          return { ...p, opciones: [...p.opciones, nuevaOpcion] };
        }
        return p;
      })
    }));
  }

  handleEliminarOpcion = (preguntaId, opcionId) => {
    this.setState(prevState => ({
      preguntas: prevState.preguntas.map(p => {
        if (p.id === preguntaId) {
          return { ...p, opciones: p.opciones.filter(opt => opt.id !== opcionId) };
        }
        return p;
      })
    }));
  }

  handleOpcionChange = (preguntaId, opcionId, campo, valor) => {
    this.setState(prevState => ({
      preguntas: prevState.preguntas.map(p => {
        if (p.id === preguntaId) {
          return {
            ...p,
            opciones: p.opciones.map(opt => 
              opt.id === opcionId ? { ...opt, [campo]: valor } : opt
            )
          };
        }
        return p;
      })
    }));
  }

  // === LÓGICA DE FINALIZACIÓN Y GUARDADO ===

  handleFinalizarExamen = (e) => {
    e.preventDefault();
    const { titulo, fechaExamen, duracionMinutos, preguntas } = this.state;
    if (!titulo || !fechaExamen || !duracionMinutos || preguntas.length === 0) {
      this.setState({ error: 'Complete los datos generales del examen y añada al menos una pregunta.' });
      return;
    }
    let puntaje = 0;
    preguntas.forEach(p => {
      if (p.tipo === 'si_no') puntaje += 1;
      else if (p.tipo === 'multiple') puntaje += 2;
    });
    this.setState({ puntajeCalculado: puntaje, isConfirmModalOpen: true, error: '' });
  }
  
  handleConfirmarRegistro = async () => {
    this.setState({ saving: true });
    const { titulo, descripcion, fechaExamen, duracionMinutos, puntajeCalculado, preguntas, currentUser } = this.state;
    const { materiaId } = this.props.params;

    try {
      await addDoc(collection(db, 'examenes'), {
        titulo,
        descripcion: descripcion || '',
        fecha_examen: fechaExamen,
        duracion_minutos: Number(duracionMinutos),
        puntaje_total: puntajeCalculado,
        materia_id: materiaId,
        docente_id: currentUser.uid,
        preguntas: preguntas,
        createdAt: serverTimestamp()
      });
      this.setState({ 
        success: '¡Examen creado correctamente!',
        error: '',
        isConfirmModalOpen: false, 
        saving: false, 
        // Limpiamos el formulario
        preguntas: [], 
        titulo: '',
        descripcion: '',
        fechaExamen: '',
        duracionMinutos: ''
      });
    } catch (e) {
      this.setState({ error: 'No se pudo guardar el examen.', saving: false });
    }
  }

  render() {
    const { materia, titulo, descripcion, fechaExamen, duracionMinutos, preguntas, saving, error, success, isConfirmModalOpen, puntajeCalculado } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <div className="crear-examen-container">
              <h3 className="mb-1">Constructor de Examen</h3>
              {materia && <p className="text-muted mb-4">Para la materia de: <strong>{materia.nombre}</strong></p>}
              
              <form onSubmit={this.handleFinalizarExamen} className="card shadow-sm p-4">
                {/* --- Datos Generales del Examen --- */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="titulo" className="form-label">Título del Examen</label>
                    <input type="text" className="form-control" id="titulo" name="titulo" value={titulo} onChange={this.handleInputChange} required />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label htmlFor="fechaExamen" className="form-label">Fecha del Examen</label>
                    <input type="date" className="form-control" id="fechaExamen" name="fechaExamen" value={fechaExamen} onChange={this.handleInputChange} required />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label htmlFor="duracionMinutos" className="form-label">Duración (minutos)</label>
                    <input type="number" className="form-control" id="duracionMinutos" name="duracionMinutos" value={duracionMinutos} onChange={this.handleInputChange} required />
                  </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="descripcion" className="form-label">Instrucciones (Opcional)</label>
                    <textarea className="form-control" id="descripcion" name="descripcion" rows="2" value={descripcion} onChange={this.handleInputChange}></textarea>
                </div>
                

                {/* --- Constructor de Preguntas --- */}
                <hr className="my-4"/>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>Preguntas del Examen</h4>
                  <div>
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => this.handleAgregarPregunta('si_no')}>+ Añadir Sí/No</Button>
                    <Button variant="outline-primary" size="sm" onClick={() => this.handleAgregarPregunta('multiple')}>+ Añadir Opción Múltiple</Button>
                  </div>
                </div>

                {preguntas.map((pregunta, index) => (
                  <div key={pregunta.id} className="pregunta-card">
                    <div className="pregunta-header">
                      <strong>Pregunta {index + 1}: {pregunta.tipo === 'si_no' ? 'Sí/No (1 pto)' : 'Opción Múltiple (2 pts)'}</strong>
                      <Button variant="danger" size="sm" onClick={() => this.handleEliminarPregunta(pregunta.id)}><Trash2 size={16}/></Button>
                    </div>
                    <div className="pregunta-body">
                      <textarea 
                        className="form-control mb-2" 
                        placeholder={`Escriba el enunciado de la pregunta ${index + 1}...`}
                        value={pregunta.texto}
                        onChange={(e) => this.handlePreguntaTextoChange(pregunta.id, e.target.value)}
                        rows="2"
                      />
                      {pregunta.tipo === 'si_no' && (
                        <div className="d-flex gap-3">
                          <label className='form-check-label'>Respuesta Correcta:</label>
                          <div className="form-check"><input type="radio" className="form-check-input" name={`resp-${pregunta.id}`} checked={pregunta.respuestaCorrecta === 'si'} onChange={() => this.handleRespuestaCorrectaChange(pregunta.id, 'si')}/> <label>Sí</label></div>
                          <div className="form-check"><input type="radio" className="form-check-input" name={`resp-${pregunta.id}`} checked={pregunta.respuestaCorrecta === 'no'} onChange={() => this.handleRespuestaCorrectaChange(pregunta.id, 'no')}/> <label>No</label></div>
                        </div>
                      )}
                      {pregunta.tipo === 'multiple' && (
                        <div>
                          {pregunta.opciones.map((opcion, optIndex) => (
                            <div key={opcion.id} className="opcion-multiple-item">
                              <input type="checkbox" className="form-check-input" checked={opcion.esCorrecta} onChange={(e) => this.handleOpcionChange(pregunta.id, opcion.id, 'esCorrecta', e.target.checked)} title="Marcar como correcta"/>
                              <input type="text" className="form-control form-control-sm" placeholder={`Opción ${optIndex + 1}`} value={opcion.texto} onChange={(e) => this.handleOpcionChange(pregunta.id, opcion.id, 'texto', e.target.value)} />
                              <Button variant="outline-danger" size="sm" onClick={() => this.handleEliminarOpcion(pregunta.id, opcion.id)}>X</Button>
                            </div>
                          ))}
                          <Button variant="link" size="sm" onClick={() => this.handleAgregarOpcion(pregunta.id)}>+ Agregar opción</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {error && <div className="alert alert-danger mt-4">{error}</div>}
                {success && <div className="alert alert-success mt-4">{success}</div>}
                
                <button type="submit" className="btn btn-success mt-4 p-2 w-100 fw-bold">Finalizar y Revisar Examen</button>
              </form>
            </div>
          </div>
        </main>

        <Modal
          show={isConfirmModalOpen}
          onHide={() => this.setState({ isConfirmModalOpen: false })}
          title="Confirmar Creación del Examen"
          footer={
            <>
              <Button variant="secondary" onClick={() => this.setState({ isConfirmModalOpen: false })}>Seguir Editando</Button>
              <Button variant="primary" onClick={this.handleConfirmarRegistro} disabled={saving}>{saving ? 'Registrando...' : 'Registrar Examen'}</Button>
            </>
          }
        >
          <p>El examen ha sido creado con un puntaje total de <strong>{puntajeCalculado} puntos</strong>.</p>
          <p>¿Deseas registrar este examen en el sistema? No podrás editarlo después.</p>
        </Modal>

      </div>
    );
  }
}

function CrearExamenConRouter(props) {
  return <CrearExamen {...props} params={useParams()} navigate={useNavigate()} />;
}

export default CrearExamenConRouter;
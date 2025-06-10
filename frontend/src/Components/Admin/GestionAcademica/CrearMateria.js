// frontend/src/Components/Admin/GestionAcademica/CrearMateria.js
import React, { Component } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';


import '../../../Styles/Admin/CrearMateria.css';

class CrearMateria extends Component {
  state = {
    nombre: '',
    codigo: '',
    facultad: '',
    jefe_carrera: '',
    mensaje: ''
  };

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    const { nombre, codigo, facultad, jefe_carrera } = this.state;
    try {
      await addDoc(collection(db, 'materias'), {
        nombre,
        codigo,
        facultad,
        jefe_carrera,
        createdAt: serverTimestamp()
      });
      this.setState({
        mensaje: 'Materia creada correctamente',
        nombre: '',
        codigo: '',
        facultad: '',
        jefe_carrera: ''
      });
    } catch (error) {
      console.error('Error al crear materia en Firestore:', error);
      this.setState({ mensaje: 'Error al crear materia: ' + error.message });
    }
  }

  render() {
    const { nombre, codigo, facultad, jefe_carrera, mensaje } = this.state;
    return (
      <>
        
        <div className="dashboard-layout">
          
          <main className="main-content crear-materia-container">
            <div className="card crear-materia-card p-4">
              <h3 className="mb-4 text-center">Crear Materia</h3>
              <form onSubmit={this.handleSubmit}>
                <div className="form-group mb-3">
                  <label>Nombre de la Materia</label>
                  <input
                    type="text"
                    name="nombre"
                    value={nombre}
                    onChange={this.handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Código</label>
                  <input
                    type="text"
                    name="codigo"
                    value={codigo}
                    onChange={this.handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Facultad</label>
                  <input
                    type="text"
                    name="facultad"
                    value={facultad}
                    onChange={this.handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Jefe de Carrera</label>
                  <input
                    type="text"
                    name="jefe_carrera"
                    value={jefe_carrera}
                    onChange={this.handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-success w-100">
                  Guardar Materia
                </button>
              </form>
              {mensaje && (
                <div className="alert alert-info mt-3 text-center">{mensaje}</div>
              )}
            </div>
          </main>
        </div>
      </>
    );
  }
}

export default CrearMateria;

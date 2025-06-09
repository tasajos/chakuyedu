import React, { Component } from 'react';
import axios from 'axios';
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
      const res = await axios.post(
        'http://localhost:5000/api/materias/crear',
        { nombre, codigo, facultad, jefe_carrera }
      );
      this.setState({
        mensaje: res.data.mensaje,
        nombre: '',
        codigo: '',
        facultad: '',
        jefe_carrera: ''
      });
    } catch (err) {
      this.setState({ mensaje: 'Error al crear la materia' });
    }
  }

  render() {
    const { nombre, codigo, facultad, jefe_carrera, mensaje } = this.state;
    return (
      <div className="crear-materia-container">
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
              Guardar
            </button>
          </form>

          {mensaje && (
            <div className="alert alert-info mt-3 text-center">
              {mensaje}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default CrearMateria;

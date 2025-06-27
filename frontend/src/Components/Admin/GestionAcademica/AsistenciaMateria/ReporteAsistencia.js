import React, { Component } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import SidebarMenu from '../../../SidebarMenu';

// --- BLOQUE DE IMPORTACIONES CORREGIDO ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Search } from 'lucide-react';
import '../../../../Styles/Admin/ListadoAsistencia.css';

class ReporteAsistencia extends Component {
  state = {
    ciBusqueda: '',
    loading: false,
    mensaje: '',
    error: '',
  };

  handleInputChange = (e) => {
    this.setState({ ciBusqueda: e.target.value });
  }

  handleExportPDF = async (e) => {
    e.preventDefault();
    const { ciBusqueda } = this.state;
    if (!ciBusqueda.trim()) {
      this.setState({ error: 'Por favor, ingrese un número de carnet.' });
      return;
    }

    this.setState({ loading: true, error: '', mensaje: '' });

    try {
      const qEstudiante = query(collection(db, 'usuarios'), where('carnet_identidad', '==', ciBusqueda));
      const estudianteSnap = await getDocs(qEstudiante);

      if (estudianteSnap.empty) {
        this.setState({ error: 'No se encontró ningún estudiante con ese CI.', loading: false });
        return;
      }
      
      const estudianteData = estudianteSnap.docs[0].data();
      const estudianteId = estudianteSnap.docs[0].id;

      const qAsistencia = query(collection(db, 'asistencias'), where('estudiante_id', '==', estudianteId));
      const asistenciaSnap = await getDocs(qAsistencia);

      if (asistenciaSnap.empty) {
        this.setState({ error: 'Este estudiante no tiene registros de asistencia.', loading: false });
        return;
      }
      
      const historialPromises = asistenciaSnap.docs.map(async (asistenciaDoc) => {
        const data = asistenciaDoc.data();
        const materiaSnap = await getDoc(doc(db, 'materias', data.materia_id));
        const materiaNombre = materiaSnap.exists() ? materiaSnap.data().nombre : 'N/A';
        
        const docenteQuery = query(collection(db, 'docente_materia'), where('materia_id', '==', data.materia_id));
        const docenteMateriaSnap = await getDocs(docenteQuery);
        let docenteNombre = 'No asignado';
        if (!docenteMateriaSnap.empty) {
            const docenteId = docenteMateriaSnap.docs[0].data().docente_id;
            const docenteSnap = await getDoc(doc(db, 'usuarios', docenteId));
            if (docenteSnap.exists()) {
                const d = docenteSnap.data();
                docenteNombre = `${d.nombre} ${d.apellido_paterno}`;
            }
        }
        
        return { ...data, materiaNombre, docenteNombre };
      });

      const historialCompleto = await Promise.all(historialPromises);
      historialCompleto.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      this.generarPDF(estudianteData, historialCompleto);

      this.setState({ loading: false, mensaje: 'Reporte generado exitosamente.' });

    } catch (error) {
      console.error("Error generando el reporte:", error);
      this.setState({ error: 'Ocurrió un error al generar el reporte.', loading: false });
    }
  }

  generarPDF = (estudiante, historial) => {
    const doc = new jsPDF();
    const studentFullName = `${estudiante.nombre} ${estudiante.apellido_paterno} ${estudiante.apellido_materno}`;

    doc.setFontSize(18);
    doc.text("Reporte de Asistencia Individual", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Estudiante: ${studentFullName}`, 14, 35);
    doc.text(`Carnet de Identidad: ${estudiante.carnet_identidad}`, 14, 42);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-BO')}`, 196, 42, { align: 'right' });

    const tableColumn = ["Fecha", "Materia", "Docente a Cargo", "Estado"];
    const tableRows = [];
    historial.forEach(registro => {
        const rowData = [
            registro.fecha,
            registro.materiaNombre,
            registro.docenteNombre,
            registro.estado.charAt(0).toUpperCase() + registro.estado.slice(1)
        ];
        tableRows.push(rowData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 55,
    });
    
    const finalY = doc.lastAutoTable.finalY || 100;
    doc.setFontSize(11);
    doc.text("______________________", 105, finalY + 40, { align: 'center' });
    doc.text("Firma del Responsable", 105, finalY + 47, { align: 'center' });

    doc.save(`reporte_asistencia_${estudiante.carnet_identidad}.pdf`);
  }

  render() {
    const { ciBusqueda, loading, mensaje, error } = this.state;

    return (
      <div className="dashboard-layout">
        <SidebarMenu />
        <main className="main-content">
          <div className="container-fluid p-4">
            <h3 className="mb-4">Generar Reporte de Asistencia</h3>
            <div className="card shadow-sm">
              <div className="card-body">
                <p className="card-text text-muted">Ingrese el carnet de identidad del estudiante para generar un reporte completo de su historial de asistencia en todas las materias.</p>
                <form onSubmit={this.handleExportPDF}>
                  <div className="row g-2 align-items-end">
                    <div className="col-md-10">
                      <label htmlFor="ci-search" className="form-label">Carnet de Identidad del Estudiante</label>
                      <input 
                        type="text" 
                        id="ci-search"
                        className="form-control" 
                        value={ciBusqueda}
                        onChange={this.handleInputChange}
                        placeholder="Ingrese el número de CI..."
                      />
                    </div>
                    <div className="col-md-2">
                      {/*-- <button type="submit" className="btn btn-danger w-100" disabled={loading}>*/}
                        <button type="submit" className="btn btn-info w-100" disabled={loading}>
                        {loading ? 'Generando...' : <><Download size={16} className="me-2"/>Exportar</>}
                      </button>
                    </div>
                  </div>
                </form>
                {mensaje && <div className="alert alert-success mt-3">{mensaje}</div>}
                {error && <div className="alert alert-danger mt-3">{error}</div>}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default ReporteAsistencia;
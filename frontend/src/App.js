// frontend/src/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/auth/usuarios')
      .then(res => setUsuarios(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="container mt-5">
      <h2>Usuarios registrados</h2>
      <ul>
        {usuarios.map((u) => (
          <li key={u.id}>{u.nombre} - {u.correo}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;

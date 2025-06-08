import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1) Borrar usuario del localStorage
    localStorage.removeItem('usuario');
    // 2) Redirigir al login
    navigate('/');
  };

  return (
    <button 
      className="btn btn-outline-danger"
      onClick={handleLogout}
    >
      Cerrar Sesión
    </button>
  );
};

export default Logout;

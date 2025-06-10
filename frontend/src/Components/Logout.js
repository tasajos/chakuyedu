// frontend/src/Components/Logout.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // 1) Cerrar sesión en Firebase Auth
      await signOut(auth);
    } catch (err) {
      console.error('Error al cerrar sesión en Firebase:', err);
    }

    // 2) Borrar usuario del localStorage
    localStorage.removeItem('usuario');

    // 3) Redirigir al login
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

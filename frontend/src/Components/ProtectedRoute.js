// frontend/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, rolPermitido }) => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario || usuario.rol !== rolPermitido) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;

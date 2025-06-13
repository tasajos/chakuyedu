import React from 'react';
import '../Styles/Navbar.css';
import logo from '../assets/logocha.png';  // Pon aquí tu logo

const NavBar = () => {
  const handleLogout = () => {
    localStorage.removeItem('usuario');
    window.location.href = '/';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4">
      <a className="navbar-brand d-flex align-items-center" href="/">
        <img src={logo} alt="Logo" className="navbar-logo me-2" />
        <span className="navbar-title">Chakuy - SisEdu</span>
      </a>
      <div className="ms-auto">
        <button
          className="btn btn-danger logout-btn"
          onClick={handleLogout}
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default NavBar;

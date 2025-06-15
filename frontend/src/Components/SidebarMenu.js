// frontend/src/components/SidebarMenu.js
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Settings, Users, UserCheck,
  BookOpen, BarChart2,
  User, FileText, Award,
  Menu as MenuIcon,
  X as CloseIcon
} from 'lucide-react';
import '../Styles/SidebarMenu.css';

const menuConfig = {
  admin: [
    { icon: Settings,    label: 'Mantenimiento',       to: '/admin/mantenimiento' },
    { icon: Users,       label: 'Gestión Usuarios',    to: '/admin/GestionUsuarios/GestionUsuarios' },
    { icon: UserCheck,   label: 'Gestión Docente',     to: '/admin/GestionDocente/GestionDocente' },
    { icon: BookOpen,    label: 'Gestión Académica',   to: '/admin/GestionAcademica/GestionAcademica' },
    { icon: BarChart2,   label: 'Informes',            to: '/admin/informes' },
  ],
  docente: [
    { icon: BookOpen,    label: 'Gestión Materias',     to: '/docente/GestionMateria/GestionMaterias' },
    { icon: Users,       label: 'Gestión Estudiantes',  to: '/Docente/GestionEstudiante/SeguimientoEstudiante' },
    { icon: UserCheck,   label: 'Gestión Académica',    to: '/Docente/GestionAcademica/SistemaAcademico' },
    { icon: User,        label: 'Perfil',               to: '/Docente/PerfilDocente/PerfilDocentes' },
  ],
  estudiante: [
    { icon: BookOpen,    label: 'Materias',             to: '/Estudiante/GestionMateria/EstudianteMateria' },
    { icon: User,        label: 'Perfil',               to: '/Estudiante/PerfilEstudiante/PerfilEstudiantes' },
    { icon: FileText,    label: 'Exámenes',             to: '/estudiante/examenes' },
    { icon: Award,       label: 'Certificados',         to: '/estudiante/certificados' },
  ]
};

const BREAKPOINT = 768; // px a partir de los cuales consideramos "escritorio"

const SidebarMenu = () => {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const items   = menuConfig[usuario.rol] || [];

  const [isMobile, setIsMobile] = useState(window.innerWidth < BREAKPOINT);
  const [open, setOpen] = useState(!isMobile);

  // listener para cambiar entre móvil/escritorio
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < BREAKPOINT;
      setIsMobile(mobile);
      setOpen(!mobile);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      {/* Botón flotante sólo en móvil */}
      {isMobile && (
        <button
          className="sidebar-toggle"
          onClick={() => setOpen(o => !o)}
        >
          {open ? <CloseIcon size={24}/> : <MenuIcon size={24}/>}
        </button>
      )}

      <nav className={`sidebar-menu ${open ? 'open' : 'closed'}`}>
        <ul>
          {items.map(({ icon: Icon, label, to }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `menu-link${isActive ? ' active' : ''}`
                }
                onClick={() => isMobile && setOpen(false)}
              >
                <Icon className="menu-icon" size={20}/>
                <span className="menu-label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default SidebarMenu;


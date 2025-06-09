import React from 'react';
import { NavLink } from 'react-router-dom';
import {Settings, Users, UserCheck, BookOpen, BarChart2, User, FileText, Award} from 'lucide-react';
import '../Styles/SidebarMenu.css';

// Configuración de las opciones por rol
const menuConfig = {
  admin: [
    { icon: Settings, label: 'Mantenimiento', to: '/admin/mantenimiento' },
    { icon: Users,    label: 'Gestión Usuarios',    to: '/admin/GestionUsuarios/GestionUsuarios'    },
    { icon: UserCheck,label: 'Gestión Docente',     to: '/admin/docentes'    },
    { icon: BookOpen, label: 'Gestión Académica',   to: '/admin/GestionAcademica/GestionAcademica'   },
    { icon: BarChart2,label: 'Informes',            to: '/admin/informes'    },
  ],
  docente: [
    { icon: BookOpen, label: 'Gestión Materias',     to: '/docente/materias'    },
    { icon: Users,    label: 'Gestión Estudiantes',  to: '/docente/estudiantes' },
    { icon: UserCheck,label: 'Gestión Académica',    to: '/docente/academica'   },
    { icon: User,     label: 'Perfil',              to: '/docente/perfil'      },
  ],
  estudiante: [
    { icon: BookOpen, label: 'Materias',            to: '/estudiante/materias'      },
    { icon: User,     label: 'Perfil',              to: '/estudiante/perfil'       },
    { icon: FileText,label: 'Exámenes',            to: '/estudiante/examenes'     },
    { icon: Award,    label: 'Certificados',        to: '/estudiante/certificados' },
  ]
};

const SidebarMenu = () => {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const items   = menuConfig[usuario.rol] || [];

  return (
    <nav className="sidebar-menu">
      <ul>
        {items.map(({ icon: Icon, label, to }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) => `menu-link${isActive ? ' active' : ''}`}
            >
              <Icon className="menu-icon" size={20}/>
              <span className="menu-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SidebarMenu;

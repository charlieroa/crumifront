// Contenido para tu archivo de Rutas (ej: src/routes/index.js)

import React from "react";
import { Navigate } from "react-router-dom";

// --- Nuestros Componentes de Página ---

// Flow Builder (nuevo)
import FlowBuilder from "../pages/flowbuilder";

// Dashboard
import DashboardPrincipal from "../pages/DashboardPrincipal";

// Calendario
import Calendar from "../pages/Calendar";

// Estilistas
import CandidateList from "../pages/Crm/CrmContacts"; // Lista de Estilistas
import SimplePage from "../pages/Pages/Profile/SimplePage/SimplePage"; // Detalle de Estilista

// Inventario
import EcommerceProducts from "../pages/Ecommerce/EcommerceProducts/index";
import EcommerceProductDetail from "../pages/Ecommerce/EcommerceProducts/EcommerceProductDetail";

// --- NUESTRO NUEVO COMPONENTE DE PUNTO DE VENTA ---
import PointOfSale from "../pages/PointOfSale";

// --- NUESTROS COMPONENTES DE NÓMINA ---
import PayrollPage from "../pages/Payroll"; // Página de la lista de nóminas
import PayrollPreview from "../pages/Payroll/PayrollPreview"; // Vista de detalle de nómina

// Autenticación y Perfil
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register"; // Registro de Clientes
import UserProfile from "../pages/Authentication/user-profile";
import TenantRegister from "../pages/Authentication/TenantRegister"; // Registro de Dueños
import Settings from '../pages/Pages/Profile/Settings/Settings';

// --- RUTAS PROTEGIDAS ---
const authProtectedRoutes = [
  // Flow Builder como inicio
  { path: "/flowbuilder", component: <FlowBuilder /> },

  // Dashboard (ya no es default, pero sigue disponible)
  { path: "/dashboard", component: <DashboardPrincipal /> },

  // Calendario
  { path: "/calendar", component: <Calendar /> },

  // Punto de Venta
  { path: "/checkout", component: <PointOfSale /> },

  // Estilistas
  { path: "/stylists", component: <CandidateList /> },
  { path: "/stylists/:id", component: <SimplePage /> },

  // Inventario
  { path: "/inventory", component: <EcommerceProducts /> },
  { path: "/inventory/:id", component: <EcommerceProductDetail /> },

  // Nómina
  { path: "/payroll", component: <PayrollPage /> },
  { path: "/payroll/preview", component: <PayrollPreview /> },
  
  // Configuración y Perfil
  { path: "/settings", component: <Settings /> },
  { path: "/profile", component: <UserProfile /> },

  // 🚀 Redirección por defecto al entrar a la app → ahora va a FlowBuilder
  {
    path: "/",
    exact: true,
    component: <Navigate to="/flowbuilder" />,
  },
  { path: "*", component: <Navigate to="/flowbuilder" /> },
];

// --- RUTAS PÚBLICAS ---
const publicRoutes = [
  // Autenticación
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/register", component: <Register /> }, // Registro de Clientes
  { path: "/register-tenant", component: <TenantRegister /> }, // Registro de Dueños
];

export { authProtectedRoutes, publicRoutes };

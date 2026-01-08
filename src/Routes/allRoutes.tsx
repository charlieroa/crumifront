import React from "react";
import { Navigate } from "react-router-dom";

// --- Nuestros Componentes de Página ---

// Landing Page (primera vista pública)
import LandingPage from "../pages/Landing";

// Onboarding
import OnboardingPage from "../pages/Onboarding";

// Income - Sistema de Documentos
import SalesInvoiceList from "../pages/income/SalesInvoice/List";
import NuevoDocumento from "../pages/income/SalesInvoice/Create"; // 🎯 Tu componente ya existe aquí

// Dashboard
import DashboardPrincipal from "../pages/DashboardPrincipal";

// Calendario
import Calendar from "../pages/Calendar";

// Clientes (CRM)
import CandidateList from "../pages/Crm/CrmContacts"; // Lista de Clientes (tabla)
import ClientesGrid from "../pages/Crm/ClientesGrid"; // Vista de Clientes estilo Team (tarjetas)
import ClienteDocumentosKanban from "../pages/Crm/ClienteDocumentosKanban"; // Kanban de documentos por cliente
import SimplePage from "../pages/Pages/Profile/SimplePage/SimplePage"; // Detalle de Estilista

// Inventario
import EcommerceProducts from "../pages/Ecommerce/EcommerceProducts/index";
import EcommerceProductDetail from "../pages/Ecommerce/EcommerceProducts/EcommerceProductDetail";

// Punto de Venta
import PointOfSale from "../pages/PointOfSale";

// Nómina
import PayrollPage from "../pages/Payroll"; // Página de la lista de nóminas
import PayrollPreview from "../pages/Payroll/PayrollPreview"; // Vista de detalle de nómina

// Autenticación y Perfil
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register"; // Registro de Clientes
import UserProfile from "../pages/Authentication/user-profile";
import TenantRegister from "../pages/Authentication/TenantRegister"; // Registro de Dueños
import Settings from '../pages/Pages/Profile/Settings/Settings';
import AuthGoogleCallback from '../pages/Authentication/AuthGoogleCallback';
import EmployeeKanban from '../pages/Tasks/EmployeeKanban'; // Kanban route
import TaskDashboard from "../pages/Tasks/TaskDashboard";

// --- RUTAS PROTEGIDAS ---
const authProtectedRoutes = [
  // 🎯 ONBOARDING - Primera pantalla de configuración
  { path: "/onboarding", component: <OnboardingPage /> },

  // 📄 SISTEMA DE DOCUMENTOS - Sistema unificado
  { path: "/ingresos/documentos", component: <SalesInvoiceList /> }, // Lista de documentos
  { path: "/ingresos/nuevo", component: <NuevoDocumento /> }, // Crear documento (acepta ?tipo=factura|cotizacion|remision|nota-debito|nota-credito|pago)

  // 📄 Rutas alternativas (aliases para compatibilidad)
  { path: "/ingresos/factura-venta", component: <SalesInvoiceList /> },
  { path: "/ingresos/factura-venta/crear", component: <NuevoDocumento /> },

  // 🏠 Dashboard
  { path: "/dashboard", component: <DashboardPrincipal /> },

  // 📅 Calendario
  { path: "/calendar", component: <Calendar /> },

  // 🛒 Punto de Venta
  { path: "/checkout", component: <PointOfSale /> },

  // 👥 Clientes (CRM)
  { path: "/clientes", component: <ClientesGrid /> }, // Vista principal de clientes (tarjetas estilo Team)
  { path: "/clientes/lista", component: <CandidateList /> }, // Vista alternativa de clientes (tabla)
  { path: "/clientes/:clientId/documentos", component: <ClienteDocumentosKanban /> }, // Kanban de documentos del cliente

  // ✂️ Estilistas (legacy routes)
  { path: "/stylists", component: <CandidateList /> },
  { path: "/stylists/:id", component: <SimplePage /> },

  // 📦 Inventario
  { path: "/inventory", component: <EcommerceProducts /> },
  { path: "/inventory/:id", component: <EcommerceProductDetail /> },

  // 💰 Nómina
  { path: "/payroll", component: <PayrollPage /> },
  { path: "/payroll/preview", component: <PayrollPreview /> },

  // ⚙️ Configuración y Perfil
  { path: "/settings", component: <Settings /> },
  { path: "/profile", component: <UserProfile /> },

  // 📋 Tareas de Empleado  // TAREAS
  { path: "/apps/tasks-dashboard", component: <TaskDashboard /> },
  { path: "/apps/tasks/:employeeId", component: <EmployeeKanban /> },
];

// --- RUTAS PÚBLICAS ---
const publicRoutes = [
  // 🌟 LANDING PAGE - Primera vista para usuarios no autenticados
  { path: "/", component: <LandingPage /> },

  // 🔐 Autenticación
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/register", component: <Register /> }, // Registro de Clientes
  { path: "/register-tenant", component: <TenantRegister /> }, // Registro de Dueños
  { path: "/auth-google-callback", component: <AuthGoogleCallback /> },
];

export { authProtectedRoutes, publicRoutes };

